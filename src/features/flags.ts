/**
 * On/off switches for feature modules. Hosts (this desk, or another app)
 * can disable a module without deleting it.
 */
import type { KeyStore } from "../settings.ts";

export const FEATURE_IDS = ["fade", "pencil", "trace", "page-move", "page-play"] as const;

export type FeatureId = (typeof FEATURE_IDS)[number];

export type FeatureFlags = Record<FeatureId, boolean>;

export const FLAGS_KEY = "pen-and-quill:features";

export const DEFAULT_FLAGS: FeatureFlags = {
  fade: true,
  pencil: true,
  trace: true,
  "page-move": true,
  "page-play": true,
};

export function parseFlags(raw: unknown): FeatureFlags {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const next = { ...DEFAULT_FLAGS };
  for (const id of FEATURE_IDS) {
    if (typeof o[id] === "boolean") next[id] = o[id];
  }
  return next;
}

export function loadFlags(store?: KeyStore | null): FeatureFlags {
  try {
    const raw = store
      ? store.getItem(FLAGS_KEY)
      : typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(FLAGS_KEY);
    if (!raw) return { ...DEFAULT_FLAGS };
    return parseFlags(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

export function saveFlags(flags: FeatureFlags, store?: KeyStore | null): FeatureFlags {
  const next = parseFlags(flags);
  const json = JSON.stringify(next);
  try {
    if (store) store.setItem(FLAGS_KEY, json);
    else if (typeof localStorage !== "undefined") localStorage.setItem(FLAGS_KEY, json);
  } catch {
    /* quota / private mode */
  }
  return next;
}

export function isEnabled(id: FeatureId, flags?: FeatureFlags): boolean {
  return (flags ?? loadFlags())[id];
}
