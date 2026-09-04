import { VexColorScheme } from './vex-config.interface';

/**
 * Preferencia visual de Vex (modo + paleta). Sobrevive a recarga y a logout
 * (`localStorage.clear()` debe restaurar esta key).
 */
export const VEX_VISUAL_PREFERENCE_KEY = 'preferencias-tema-visual';

export interface VexVisualPreference {
  colorScheme: VexColorScheme;
  theme: string;
}

export function readVexVisualPreference(
  storage: Storage | null,
  allowedThemes: readonly string[]
): Partial<VexVisualPreference> | null {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(VEX_VISUAL_PREFERENCE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<VexVisualPreference>;
    const restored: Partial<VexVisualPreference> = {};

    if (
      parsed.colorScheme === VexColorScheme.DARK ||
      parsed.colorScheme === VexColorScheme.LIGHT
    ) {
      restored.colorScheme = parsed.colorScheme;
    }

    if (
      typeof parsed.theme === 'string' &&
      allowedThemes.includes(parsed.theme)
    ) {
      restored.theme = parsed.theme;
    }

    return restored.colorScheme || restored.theme ? restored : null;
  } catch {
    return null;
  }
}

export function writeVexVisualPreference(
  storage: Storage | null,
  preference: VexVisualPreference
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(VEX_VISUAL_PREFERENCE_KEY, JSON.stringify(preference));
  } catch {
    // Quota / modo privado: no bloquear el cambio visual en sesión.
  }
}

/** Conserva la preferencia visual cuando se vacía localStorage (logout). */
export function preserveVexVisualPreferenceAroundClear(
  storage: Storage | null,
  clear: () => void
): void {
  if (!storage) {
    clear();
    return;
  }

  const stored = storage.getItem(VEX_VISUAL_PREFERENCE_KEY);
  clear();
  if (stored) {
    storage.setItem(VEX_VISUAL_PREFERENCE_KEY, stored);
  }
}
