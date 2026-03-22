import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Global back-handler stack for SPA / TWA navigation.
//
// Each call to useBackHandler(fn) registers one "level" of back-navigation.
// When the Android back button or a browser back-swipe fires a `popstate`,
// the innermost (most-recently registered) handler is called.
//
// Design notes:
//  - Each registration pushes ONE guard history entry so Android has something
//    to pop instead of exiting the app.
//  - On popstate we call the top handler but do NOT re-push, so a single
//    pop consumes exactly the one guard that belongs to that level.
//  - On cleanup (panel closes) we remove the handler from the stack but leave
//    any orphaned history entry; it will be silently consumed by a future pop.
// ---------------------------------------------------------------------------

type Handler = () => void;

const stack: Handler[] = [];
let initialized = false;

function ensureListener() {
  if (initialized) return;
  initialized = true;
  window.addEventListener("popstate", () => {
    const top = stack[stack.length - 1];
    if (top) {
      top();
    }
    // If stack is empty the pop falls through naturally (browser nav / TWA exit).
  });
}

/**
 * Intercept the Android / browser back gesture while `handler` is non-null.
 * Pass `null` to deactivate (e.g. when the panel is closed).
 *
 * Each non-null → null transition removes the handler from the stack.
 * Each null → non-null transition registers the handler and pushes one
 * guard history entry so the OS has something to pop.
 */
export function useBackHandler(handler: Handler | null) {
  // Always-fresh ref so the registered closure sees the latest state.
  const ref = useRef<Handler | null>(null);
  ref.current = handler;

  useEffect(() => {
    if (!handler) return;

    ensureListener();

    const fn: Handler = () => ref.current?.();
    stack.push(fn);

    // One guard entry per level so Android pops this instead of exiting.
    window.history.pushState({ pftcBack: stack.length }, "");

    return () => {
      const idx = stack.indexOf(fn);
      if (idx !== -1) stack.splice(idx, 1);
      // Leave the history entry; it will be silently consumed by the next pop.
    };
  }, [!!handler]); // eslint-disable-line react-hooks/exhaustive-deps
}
