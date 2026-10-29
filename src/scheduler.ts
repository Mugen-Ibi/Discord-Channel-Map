/** Trailing debounce with serialized writes and delayed retries. */
export function createScheduler(update: () => Promise<void>, onError: (error: unknown) => void, delayMs = 3000, retryMs = 30000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let pending = false;
  let stopped = false;
  let due = 0;
  let retryNotBefore = 0;

  function arm() {
    if (timer) clearTimeout(timer);
    if (!stopped && !running && pending) timer = setTimeout(() => void run(), Math.max(0, due - Date.now(), retryNotBefore - Date.now()));
  }
  async function run() {
    timer = undefined;
    if (stopped || running || !pending) return;
    pending = false;
    running = true;
    try {
      await update();
      retryNotBefore = 0;
    } catch (error) {
      onError(error);
      // Events queued during a failure must not shorten the promised retry backoff.
      retryNotBefore = Date.now() + retryMs;
      if (!pending) { pending = true; due = retryNotBefore; }
    } finally {
      running = false;
      arm();
    }
  }
  return {
    request(immediate = false) {
      if (stopped) return;
      pending = true;
      due = Date.now() + (immediate ? 0 : delayMs);
      arm();
    },
    stop() { stopped = true; pending = false; if (timer) clearTimeout(timer); },
  };
}
