/** Bound client waiting too: an interrupted Server Action can outlive its provider timeout. */
export async function withReaderTimeout<T>(request: () => Promise<T>, timeoutMs = 45_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(request),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Reader request timed out.')), timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

/** Session-local cache: share in-flight work, never cache failures. */
export function createReaderCache<T>(limit = 128) {
  const values = new Map<string, T>();
  const pending = new Map<string, Promise<T>>();
  return {
    peek: (key: string) => values.get(key),
    delete: (key: string) => values.delete(key),
    async load(key: string, request: () => Promise<T>): Promise<T> {
      const cached = values.get(key);
      if (cached !== undefined) return cached;
      const current = pending.get(key);
      if (current) return current;
      const work = withReaderTimeout(request).then((value) => {
        if (values.size >= limit) {
          const oldest = values.keys().next().value;
          if (oldest !== undefined) values.delete(oldest);
        }
        values.set(key, value);
        return value;
      }).finally(() => pending.delete(key));
      pending.set(key, work);
      return work;
    },
  };
}
