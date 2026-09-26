export const STORAGE_KEY = "pen-and-quill:desk";

export const INK_COLORS = [
  { id: "iron", name: "Iron gall", wet: "#110e0a", dry: "#3a2718", faded: "#8d7358" },
  { id: "sepia", name: "Sepia", wet: "#4a2410", dry: "#6b3a1c", faded: "#a07850" },
  { id: "indigo", name: "Indigo", wet: "#1a2744", dry: "#2c3d5c", faded: "#6d7a92" },
  { id: "oxblood", name: "Oxblood", wet: "#5c1214", dry: "#7a2426", faded: "#a56a64" },
  { id: "forest", name: "Forest", wet: "#142918", dry: "#2a4a32", faded: "#6e846c" },
] as const;

export type ColorId = (typeof INK_COLORS)[number]["id"];
export type NibSize = 1 | 2 | 3 | 4 | 5;
export type PenKind = "quill" | "fountain";

export type DeskSettings = {
  color: ColorId;
  size: NibSize;
  splotch: number;
  pen: PenKind;
};

export const DEFAULT_SETTINGS: DeskSettings = {
  color: "iron",
  size: 3,
  splotch: 0.45,
  pen: "quill",
};

export type KeyStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export function colorById(id: string | undefined) {
  return INK_COLORS.find((c) => c.id === id) ?? INK_COLORS[0];
}

export function parseSettings(raw: unknown): DeskSettings {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const color = INK_COLORS.some((c) => c.id === o.color) ? (o.color as ColorId) : DEFAULT_SETTINGS.color;
  const sizeNum = typeof o.size === "number" ? Math.round(o.size) : DEFAULT_SETTINGS.size;
  const size = (Math.min(5, Math.max(1, sizeNum)) as NibSize);
  const splotch =
    typeof o.splotch === "number" && Number.isFinite(o.splotch)
      ? Math.min(1, Math.max(0, o.splotch))
      : DEFAULT_SETTINGS.splotch;
  const pen: PenKind = o.pen === "fountain" ? "fountain" : "quill";
  return { color, size, splotch, pen };
}

export function loadSettings(store?: KeyStore | null): DeskSettings {
  try {
    const raw = store
      ? store.getItem(STORAGE_KEY)
      : typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return parseSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: DeskSettings, store?: KeyStore | null): DeskSettings {
  const next = parseSettings(settings);
  const json = JSON.stringify(next);
  try {
    if (store) store.setItem(STORAGE_KEY, json);
    else if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, json);
  } catch {
    /* quota / private mode */
  }
  return next;
}

export function memoryStore(init: Record<string, string> = {}): KeyStore & { data: Record<string, string> } {
  const data = { ...init };
  return {
    data,
    getItem: (key) => (key in data ? data[key]! : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}
