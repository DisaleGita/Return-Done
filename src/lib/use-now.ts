"use client";

import { useSyncExternalStore } from "react";

let current: Date | null = null;

function subscribe(onChange: () => void) {
  const id = window.setInterval(() => {
    current = new Date();
    onChange();
  }, 60_000);
  return () => window.clearInterval(id);
}

const getSnapshot = () => (current ??= new Date());
const getServerSnapshot = () => null;

/**
 * The current time on the client, refreshed every minute; `null` during
 * server rendering. Anything that depends on "today" (pickup days, deadline
 * labels) waits for this, so server and client HTML always match.
 */
export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
