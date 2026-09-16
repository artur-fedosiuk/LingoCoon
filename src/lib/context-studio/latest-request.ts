type RequestHandlers<T> = {
  onResult: (result: T) => void;
  onError: () => void;
  onSettled: () => void;
};

/** Ignore obsolete results without pretending to cancel server/provider work. */
export function createLatestRequest() {
  let revision = 0;

  return {
    invalidate() {
      revision += 1;
    },
    async run<T>(request: () => Promise<T>, handlers: RequestHandlers<T>, timeoutMs = 45_000): Promise<void> {
      const requestRevision = ++revision;
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([request(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Request timed out.')), timeoutMs); })]);
        if (requestRevision === revision) handlers.onResult(result);
      } catch {
        if (requestRevision === revision) handlers.onError();
      } finally {
        clearTimeout(timer);
        if (requestRevision === revision) handlers.onSettled();
      }
    },
  };
}
