"use client";

import { useSyncExternalStore } from "react";
import { createDemoReturns } from "./demo-data";
import { toISODate } from "./dates";
import { advanceReturn, generateTrackingNumber, type ReturnRecord } from "./returns";

/**
 * Demo persistence. Returns live in this browser's localStorage, so the demo
 * works without a database. A server-backed repository could implement the
 * same small interface later.
 *
 * Demo returns are regenerated each day so their dates stay relative to
 * "today". Returns you schedule yourself are kept.
 */

const STORAGE_KEY = "returndone:returns:v1";

interface StoredState {
  seededOn: string;
  demoIds: string[];
  records: ReturnRecord[];
}

type Listener = () => void;

const listeners = new Set<Listener>();
let state: StoredState | null = null;

function seed(now: Date, keep: ReturnRecord[] = []): StoredState {
  const demo = createDemoReturns(now);
  const demoIds = demo.map((r) => r.id);
  return {
    seededOn: toISODate(now),
    demoIds,
    records: [...keep.filter((r) => !demoIds.includes(r.id)), ...demo],
  };
}

function write(next: StoredState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: keep working in memory.
  }
}

function persist(next: StoredState) {
  write(next);
  listeners.forEach((listener) => listener());
}

function load(): StoredState {
  if (state) return state;
  const now = new Date();
  let stored: StoredState | null = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredState) : null;
    if (parsed && Array.isArray(parsed.records) && Array.isArray(parsed.demoIds)) stored = parsed;
  } catch {
    stored = null;
  }

  // Called from getSnapshot, so this must not notify subscribers.
  if (!stored) {
    write(seed(now));
  } else if (stored.seededOn !== toISODate(now)) {
    const mine = stored.records.filter((r) => !stored.demoIds.includes(r.id));
    write(seed(now, mine));
  } else {
    state = stored;
  }
  return state!;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      state = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getRecords = () => load().records;
const getServerRecords = () => null;

export const returnsStore = {
  getAll: getRecords,

  get(id: string): ReturnRecord | undefined {
    return getRecords().find((r) => r.id.toLowerCase() === id.toLowerCase());
  },

  /** Adds a return. Re-numbers it in the unlikely case the ID is taken. */
  add(record: ReturnRecord): ReturnRecord {
    const current = load();
    const taken = new Set(current.records.map((r) => r.id));
    const saved = taken.has(record.id)
      ? { ...record, id: generateTrackingNumber(new Date(record.createdAt), taken) }
      : record;
    persist({ ...current, records: [saved, ...current.records] });
    return saved;
  },

  /** Demo only: moves a return to its next status. */
  advance(id: string): ReturnRecord | undefined {
    const current = load();
    let updated: ReturnRecord | undefined;
    const records = current.records.map((r) => {
      if (r.id !== id) return r;
      updated = advanceReturn(r, new Date());
      return updated;
    });
    persist({ ...current, records });
    return updated;
  },

  reset() {
    persist(seed(new Date()));
  },

  /** For tests. */
  _clearCache() {
    state = null;
  },
};

/** All returns, or `null` while rendering on the server / before hydration. */
export function useReturns(): ReturnRecord[] | null {
  return useSyncExternalStore(subscribe, getRecords, getServerRecords);
}
