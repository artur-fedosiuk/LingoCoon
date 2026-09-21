/** Boundary types for 20260913010000_reading_tts.sql; service-side use only. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TtsCacheRow = {
  cache_key: string;
  owner_id: string;
  status: 'pending' | 'ready' | 'failed';
  lease_id: string;
  lease_expires_at: string | null;
  object_path: string | null;
  expires_at: string;
  bytes: number;
};

type CacheInsert = Omit<TtsCacheRow, 'lease_expires_at' | 'object_path' | 'bytes'> & {
  lease_expires_at?: string | null;
  object_path?: string | null;
  bytes?: number;
};

type BudgetRow = {
  singleton: boolean;
  lifetime_limit: number;
  lifetime_used: number;
  credit_expires_at: string;
  daily_limit: number;
  daily_used: number;
  daily_date: string;
  user_daily_limit: number;
  concurrent_limit: number;
  storage_limit_bytes: number;
};

type UserDailyRow = { owner_id: string; usage_date: string; characters: number };
type CleanupQueueRow = {
  object_path: string;
  bytes: number;
  created_at: string;
  not_before: string;
};
type RateWindowRow = {
  scope: 'user' | 'ip';
  subject: string;
  window_start: string;
  requests: number;
};

/**
 * Use createClient<TtsDatabase> only in the privileged server adapter. Table
 * types describe the schema, not permissions: cache/queue permit SELECT/DELETE;
 * counters/configuration permit SELECT; generation writes require the RPCs.
 * JSON RPC results still require runtime validation at the service boundary.
 */
export type TtsDatabase = {
  public: {
    Tables: {
      reading_tts_cache: {
        Row: TtsCacheRow;
        Insert: CacheInsert;
        Update: Partial<CacheInsert>;
        Relationships: [{
          foreignKeyName: 'reading_tts_cache_owner_id_fkey';
          columns: ['owner_id'];
          isOneToOne: false;
          referencedRelation: 'users';
          referencedColumns: ['id'];
        }];
      };
      reading_tts_budget: {
        Row: BudgetRow;
        Insert: Partial<BudgetRow>;
        Update: Partial<BudgetRow>;
        Relationships: [];
      };
      reading_tts_user_daily: {
        Row: UserDailyRow;
        Insert: Omit<UserDailyRow, 'characters'> & { characters?: number };
        Update: Partial<UserDailyRow>;
        Relationships: [{
          foreignKeyName: 'reading_tts_user_daily_owner_id_fkey';
          columns: ['owner_id'];
          isOneToOne: false;
          referencedRelation: 'users';
          referencedColumns: ['id'];
        }];
      };
      reading_tts_rate_windows: {
        Row: RateWindowRow;
        Insert: Omit<RateWindowRow, 'requests'> & { requests?: number };
        Update: Partial<RateWindowRow>;
        Relationships: [];
      };
      reading_tts_cleanup_queue: {
        Row: CleanupQueueRow;
        Insert: Omit<CleanupQueueRow, 'created_at' | 'not_before'> & {
          created_at?: string;
          not_before?: string;
        };
        Update: Partial<CleanupQueueRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      reading_tts_admit: {
        Args: { p_owner_id: string; p_cache_key: string; p_characters: number; p_ip_hash: string; p_lease_id: string; p_billable_characters: number; p_provider_requests: number };
        Returns: Json;
      };
      reading_tts_reserve_google: {
        Args: { p_owner_id: string; p_cache_key: string; p_characters: number; p_ip_hash: string; p_lease_id: string; p_billable_characters: number };
        Returns: Json;
      };
      reading_tts_reserve: {
        Args: {
          p_owner_id: string;
          p_cache_key: string;
          p_characters: number;
          p_ip_hash: string;
          p_lease_id: string;
        };
        Returns: Json;
      };
      reading_tts_complete: {
        Args: {
          p_owner_id: string;
          p_cache_key: string;
          p_lease_id: string;
          p_object_path: string;
          p_bytes: number;
        };
        Returns: boolean;
      };
      reading_tts_fail: {
        Args: { p_owner_id: string; p_cache_key: string; p_lease_id: string };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
