/** Mensaje mostrado bajo #productSearchInput cuando se detecta un QR/URL en lugar de un código de barras. */
export const QR_SCAN_REJECTION_MESSAGE =
  'Se leyó un código QR. Use el código de barras numérico e intente nuevamente.';

export interface ProductSearchTermResolution {
  rejected: boolean;
  term: string;
  message: string | null;
}

/**
 * Detecta lecturas de QR o URL (incluye variantes corruptas por layout de teclado del lector).
 */
export function isLikelyQrOrUrlScan(raw: string): boolean {
  const term = raw.trim();
  if (!term) {
    return false;
  }

  if (/^https?:\/\//i.test(term)) {
    return true;
  }
  if (/^www\./i.test(term)) {
    return true;
  }

  // Lector con teclado ES: "https://" → "httpsÑ--" o "httpsÑ"
  if (/^https?Ñ/i.test(term)) {
    return true;
  }
  if (/^https?[-–]{1,2}/i.test(term) && /[a-z0-9]+\.[a-z]{2,}/i.test(term)) {
    return true;
  }

  if (/(^|[-./])qrco\.de([-./]|$)/i.test(term)) {
    return true;
  }

  if (/https?/i.test(term) && /\.(de|com|net|org|io|co)([-./]|$)/i.test(term)) {
    return true;
  }

  return false;
}

/**
 * Intenta extraer un código de barras numérico (EAN/UPC) embebido en un QR/URL.
 */
export function tryExtractBarcodeFromQrOrUrl(raw: string): string | null {
  const term = raw.trim();
  if (!term) {
    return null;
  }

  const slug = term
    .replace(/^https?:\/\//i, '')
    .replace(/^https?Ñ[-–]?/i, '')
    .replace(/^https?[-–]+/i, '')
    .replace(/^www\./i, '');

  const segments = slug.split(/[-./\\]+/).filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? '';

  if (/^\d{8,14}$/.test(lastSegment)) {
    return lastSegment;
  }

  const digitMatch = term.match(/\d{8,14}/);
  return digitMatch ? digitMatch[0] : null;
}

/**
 * Normaliza el término de búsqueda de producto:
 * - Colapsa 2+ espacios seguidos a un solo espacio
 * - No hace trim: un espacio simple al inicio/fin se conserva (p. ej. "ron ")
 */
export function normalizeProductSearchTerm(raw: string | null | undefined): string {
  if (raw == null || raw === '') {
    return '';
  }
  return raw.replace(/\s{2,}/g, ' ');
}

export function resolveProductSearchTerm(raw: string): ProductSearchTermResolution {
  const term = normalizeProductSearchTerm(raw);
  if (!term) {
    return { rejected: false, term: '', message: null };
  }

  // Heurística QR sobre el texto sin espacios extremos (no altera el término a buscar).
  const forQrCheck = term.trim();
  if (!forQrCheck) {
    return { rejected: false, term, message: null };
  }

  if (!isLikelyQrOrUrlScan(forQrCheck)) {
    return { rejected: false, term, message: null };
  }

  const extracted = tryExtractBarcodeFromQrOrUrl(forQrCheck);
  if (extracted) {
    return { rejected: false, term: extracted, message: null };
  }

  return {
    rejected: true,
    term,
    message: QR_SCAN_REJECTION_MESSAGE
  };
}
