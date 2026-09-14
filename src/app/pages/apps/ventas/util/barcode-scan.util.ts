/** Mensaje mostrado bajo #productSearchInput cuando se detecta un QR/URL en lugar de un código de barras. */
export const QR_SCAN_REJECTION_MESSAGE =
  'Se leyó un código QR. Use el código de barras numérico e intente nuevamente.';

/** Lectura accidental de barras/QR con el foco en «Paga con: Efectivo». */
export const PAGO_EFECTIVO_SCAN_ALERT_MESSAGE =
  'Verifique este pago antes de intentar consultar otro producto.';

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

/** EAN/UPC típico (8–14 dígitos) pegado en un campo de monto. */
export function isLikelyProductBarcodeDigits(raw: string): boolean {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return /^\d{8,14}$/.test(digits);
}

export type ScanKeyEvent = Pick<
  KeyboardEvent,
  'key' | 'code' | 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey' | 'isComposing'
>;

/** Enter o Tab de sufijo de lectora (en Mac a veces no llega el Enter). */
export function isBarcodeTerminatorKey(event: ScanKeyEvent): boolean {
  return event.key === 'Enter' || event.key === 'Tab';
}

/**
 * Carácter imprimible de un keydown de lectora.
 * En macOS HID a veces `key` es Unidentified/Dead y el dígito viene en `code`.
 */
export function scanCharFromKeyboardEvent(event: ScanKeyEvent): string | null {
  if (event.key.length === 1) {
    return event.key;
  }
  if (
    event.key === 'Unidentified' ||
    event.key === 'Process' ||
    event.key === 'Dead'
  ) {
    return scanCharFromCode(event.code, event.shiftKey);
  }
  return null;
}

function scanCharFromCode(code: string, shift: boolean): string | null {
  if (!code) {
    return null;
  }
  if (/^Digit[0-9]$/.test(code)) {
    return code.slice(5);
  }
  if (/^Numpad[0-9]$/.test(code)) {
    return code.slice(6);
  }
  if (/^Key[A-Z]$/.test(code)) {
    const letter = code.slice(3);
    return shift ? letter : letter.toLowerCase();
  }
  return null;
}

/**
 * Código completo aunque la lectora no mande Enter.
 * Evita confirmar tipeo humano corto ("coca", "123").
 */
export function shouldAutoCommitBarcodeBuffer(raw: string): boolean {
  const text = String(raw ?? '').trim();
  if (/^\d{8,14}$/.test(text)) {
    return true;
  }
  return /^[A-Za-z0-9]{8,}$/.test(text) && /\d/.test(text);
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
