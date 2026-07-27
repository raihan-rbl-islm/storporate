"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DelayedActionStatus = "pending" | "slow" | "ok" | "error";

export interface DelayedActionGuardOptions {
  /** Milliseconds before the action is flagged "slow". Default 3000. */
  slowAfterMs?: number;
  /** Called when the action resolves successfully. */
  onResolved?: (value: unknown) => void;
  /** Called when the action throws. */
  onRejected?: (error: unknown) => void;
}

export interface DelayedActionGuard {
  status: DelayedActionStatus;
  elapsedMs: number;
  run: <T>(action: () => Promise<T>) => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Wraps an async action with a "slow" indicator. While the action is
 * pending, status is "pending". After `slowAfterMs` ms, status flips
 * to "slow" (UI can show a "still working" message). On resolve,
 * status becomes "ok". On throw, status becomes "error".
 */
export function useDelayedActionGuard(
  options: DelayedActionGuardOptions = {},
): DelayedActionGuard {
  const { slowAfterMs = 3000, onResolved, onRejected } = options;
  const [status, setStatus] = useState<DelayedActionStatus>("ok");
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setStatus("ok");
    setElapsedMs(0);
    startedAtRef.current = null;
  }, [clearTimer]);

  const run = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
      clearTimer();
      startedAtRef.current = Date.now();
      setStatus("pending");
      setElapsedMs(0);
      timerRef.current = window.setTimeout(() => {
        setStatus((s) => (s === "pending" ? "slow" : s));
      }, slowAfterMs);

      try {
        const value = await action();
        clearTimer();
        setStatus("ok");
        if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current);
        onResolved?.(value);
        return value;
      } catch (err) {
        clearTimer();
        setStatus("error");
        if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current);
        onRejected?.(err);
        return undefined;
      }
    },
    [clearTimer, slowAfterMs, onResolved, onRejected],
  );

  return { status, elapsedMs, run, reset };
}