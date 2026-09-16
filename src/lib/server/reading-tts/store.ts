import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { TtsError } from '../../reading-tts/contract';
import type { TtsDatabase } from './database-types';
import type { ReadingTtsStorageConfig } from './config';
import type { Reservation, TtsStore } from './service';

const reservationSchema = z.object({ status: z.enum(['hit', 'wait', 'reserved', 'rate_limited', 'quota_exceeded', 'busy']), objectPath: z.string().optional() });
const validPath = /^[0-9a-f-]{36}\/[0-9a-f]{64}\/[0-9a-f-]{36}\.ndjson$/u;
export const TTS_BUCKET = 'reading-audio';
export function createTtsStorageClient(config: ReadingTtsStorageConfig, signal?: AbortSignal) {
  return createClient<TtsDatabase>(config.NEXT_PUBLIC_SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.any([...(options?.signal ? [options.signal] : []), ...(signal ? [signal] : []), AbortSignal.timeout(10_000)]) }) },
  });
}
export function createSupabaseTtsStore(client: SupabaseClient<TtsDatabase>): TtsStore {
  const bucket = client.storage.from(TTS_BUCKET);
  return {
    async reserve(owner, key, characters, ipHash, lease, billableCharacters = characters): Promise<Reservation> {
      await cleanupExpiredTts(client, key, owner);
      const args = { p_owner_id: owner, p_cache_key: key, p_characters: characters, p_ip_hash: ipHash, p_lease_id: lease };
      const { data, error } = await client.rpc('reading_tts_reserve_google', { ...args, p_billable_characters: billableCharacters });
      if (error) throw new TtsError('storage_failure');
      const parsed = reservationSchema.safeParse(data);
      if (!parsed.success) throw new TtsError('storage_failure');
      if (parsed.data.objectPath && (!validPath.test(parsed.data.objectPath) || !parsed.data.objectPath.startsWith(`${owner}/${key}/`))) throw new TtsError('storage_failure');
      return parsed.data;
    },
    async find(owner, key) {
      const { data, error } = await client.from('reading_tts_cache').select('status,object_path,expires_at').eq('owner_id', owner).eq('cache_key', key).maybeSingle();
      if (error) throw new TtsError('storage_failure');
      if (!data || Date.parse(data.expires_at) <= Date.now()) return null;
      return { status: data.status, objectPath: data.object_path };
    },
    async read(path) {
      if (!validPath.test(path)) throw new TtsError('storage_failure');
      const { data, error } = await bucket.createSignedUrl(path, 60);
      if (error || !data) throw new TtsError('storage_failure');
      // Keep the signed capability server-side; stream bytes to the authenticated
      // caller rather than making private text/audio public in a CDN.
      const response = await fetch(data.signedUrl, { signal: AbortSignal.timeout(30_000), cache: 'no-store', redirect: 'error' });
      if (!response.ok || !response.body) throw new TtsError('storage_failure');
      return response.body;
    },
    async save(owner, key, lease, body) {
      const path = `${owner}/${key}/${lease}.ndjson`;
      const { error } = await bucket.upload(path, body, { contentType: 'application/x-ndjson', upsert: false, cacheControl: '0' });
      if (error) throw new TtsError('storage_failure');
      const result = await client.rpc('reading_tts_complete', { p_owner_id: owner, p_cache_key: key, p_lease_id: lease, p_object_path: path, p_bytes: body.byteLength });
      if (result.error || result.data !== true) {
        await bucket.remove([path]);
        throw new TtsError('storage_failure');
      }
    },
    async fail(owner, key, lease) {
      const { error } = await client.rpc('reading_tts_fail', { p_owner_id: owner, p_cache_key: key, p_lease_id: lease });
      if (error) throw new TtsError('storage_failure');
    },
  };
}

export async function cleanupExpiredTts(client: SupabaseClient<TtsDatabase>, key?: string, owner?: string): Promise<number> {
  const now = new Date().toISOString();
  const expired = `expires_at.lte.${now},and(status.eq.pending,lease_expires_at.lte.${now})`;
  let query = client.from('reading_tts_cache').select('*').or(expired).order('expires_at').limit(key ? 1 : 100);
  if (key) query = query.eq('cache_key', key);
  if (owner) query = query.eq('owner_id', owner);
  const { data, error } = await query;
  if (error) throw new TtsError('storage_failure');
  const entries = (data ?? []).filter((entry) => !(entry.status === 'pending' && entry.lease_expires_at && Date.parse(entry.lease_expires_at) > Date.now()));
  const paths = entries.map((entry) => entry.object_path ?? `${entry.owner_id}/${entry.cache_key}/${entry.lease_id}.ndjson`);
  if (paths.some((path) => !validPath.test(path))) throw new TtsError('storage_failure');
  if (paths.length) {
    const result = await client.storage.from(TTS_BUCKET).remove(paths);
    if (result.error) throw new TtsError('storage_failure');
  }
  let removed = 0;
  for (const entry of entries) {
    // Fence each deletion to the observed owner/lease. A delayed cleanup cannot
    // remove a replacement job. The outbox retains capacity until drained.
    const deleted = await client.from('reading_tts_cache').delete().eq('cache_key', entry.cache_key).eq('owner_id', entry.owner_id).eq('lease_id', entry.lease_id).or(expired);
    if (deleted.error) throw new TtsError('storage_failure');
    removed += 1;
  }
  return removed;
}

export async function drainTtsCleanupQueue(client: SupabaseClient<TtsDatabase>): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await client.from('reading_tts_cleanup_queue').select('object_path').lte('not_before', now).order('not_before').limit(100);
  if (error) throw new TtsError('storage_failure');
  const paths = (data ?? []).map((item) => item.object_path);
  if (!paths.length) return 0;
  if (paths.some((path) => !validPath.test(path))) throw new TtsError('storage_failure');
  // Includes account-deletion cascades and crash leftovers; confirm object
  // removal before releasing its reserved storage space in PostgreSQL.
  const removed = await client.storage.from(TTS_BUCKET).remove(paths);
  if (removed.error) throw new TtsError('storage_failure');
  const deleted = await client.from('reading_tts_cleanup_queue').delete().in('object_path', paths).lte('not_before', now);
  if (deleted.error) throw new TtsError('storage_failure');
  return paths.length;
}
