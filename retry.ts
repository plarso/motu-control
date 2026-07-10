const asyncSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Retries fn with capped exponential backoff until it succeeds. Used at startup so
// launching before the MOTU AVB Discovery Service or a MIDI controller is ready
// (e.g. right after login) doesn't crash the process - it just waits and logs.
export async function retryUntilSuccess<T>(
  fn: () => Promise<T> | T,
  { label, maxDelayMs = 30000 }: { label: string; maxDelayMs?: number }
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const delayMs = Math.min(maxDelayMs, 1000 * 2 ** Math.min(attempt, 5));
      console.warn(`${label} failed (attempt ${attempt}), retrying in ${delayMs}ms:`, err);
      await asyncSleep(delayMs);
    }
  }
}
