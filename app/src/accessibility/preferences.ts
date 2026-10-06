export interface Preferences {
  schemaVersion: 1;
  contrast: 'default' | 'yellowOnBlack' | 'blackOnYellow' | 'whiteOnBlack';
  textScale: 1 | 1.25 | 1.5 | 2;
  largeControls: boolean;
  readableText: boolean;
  reducedMotion: boolean;
  crosshair: boolean;
}
export function defaultPreferences(reducedMotion = false): Preferences {
  return { schemaVersion: 1, contrast: 'default', textScale: 1, largeControls: false,
    readableText: false, reducedMotion, crosshair: false };
}
export function parsePreferences(value: unknown): Preferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid-preferences');
  const data = value as Record<string, unknown>;
  const keys = Object.keys(defaultPreferences());
  if (Object.keys(data).length !== keys.length || keys.some((key) => !(key in data)) ||
    data.schemaVersion !== 1 || !['default', 'yellowOnBlack', 'blackOnYellow', 'whiteOnBlack'].includes(String(data.contrast)) ||
    ![1, 1.25, 1.5, 2].includes(data.textScale as number) ||
    ['largeControls', 'readableText', 'reducedMotion', 'crosshair'].some((key) => typeof data[key] !== 'boolean')) {
    throw new Error('invalid-preferences');
  }
  return { ...data } as unknown as Preferences;
}

// Wyłącznie adapter zna Web Storage. Brak dostępu nie zatrzymuje aplikacji.
export class PreferenceStorage {
  private readonly key = 'nnb:preferences:v1';
  constructor(private readonly session: () => Pick<Storage, 'getItem' | 'setItem'>, private readonly persistent: () => Pick<Storage, 'getItem' | 'setItem'>) {}
  load(fallback: Preferences): { value: Preferences; failed: boolean } {
    try {
      const raw = this.session().getItem(this.key) ?? this.persistent().getItem(this.key);
      return { value: raw === null ? fallback : parsePreferences(JSON.parse(raw)), failed: false };
    } catch { return { value: fallback, failed: true }; }
  }
  save(value: Preferences, future: boolean) {
    const raw = JSON.stringify(parsePreferences(value));
    this.session().setItem(this.key, raw);
    if (future) this.persistent().setItem(this.key, raw);
  }
}

export function applyPreferences(root: HTMLElement, value: Preferences) {
  root.dataset.contrast = value.contrast;
  root.dataset.largeControls = String(value.largeControls);
  root.dataset.readableText = String(value.readableText);
  root.dataset.reducedMotion = String(value.reducedMotion);
  root.dataset.crosshair = String(value.crosshair);
  root.style.fontSize = `${18 * value.textScale}px`;
}
