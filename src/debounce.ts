/**
 * Returns a wrapped version of `fn` that only actually runs once no call has arrived for `ms`
 * milliseconds — the standard trailing-edge debounce. Kept dependency-free (no `vscode` import)
 * so the live-refresh timing behavior (Property 16) is unit-testable with fake timers, rather
 * than only observable by manually editing a file in the Extension Development Host.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number,
): (...args: Args) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}
