import type { LogInfluxRow } from '../service/logs-errores.service';

const TIME_KEYS = ['_time', 'time', 'timestamp', 'fecha', '@timestamp', 'date'];
const LEVEL_KEYS = ['level', 'severity', 'logLevel', 'nivel', 'priority'];
const MESSAGE_KEYS = [
  'message',
  'msg',
  'text',
  'error',
  'stackTrace',
  'stack',
  'body',
  'detail',
  'descripcion',
  '_value'
];

function firstString(row: LogInfluxRow, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim() !== '') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  }
  return '';
}

export function logRowTimeRaw(row: LogInfluxRow): string {
  return firstString(row, TIME_KEYS);
}

export function logRowLevel(row: LogInfluxRow): string {
  return firstString(row, LEVEL_KEYS) || '—';
}

/** Nivel normalizado para comparaciones (mayúsculas, espacios → `_`). */
export function logRowLevelNormalized(row: LogInfluxRow): string {
  const v = logRowLevel(row);
  if (v === '—') return '';
  return v.trim().toUpperCase().replace(/\s+/g, '_');
}

export function logRowMessage(row: LogInfluxRow): string {
  const msg = firstString(row, MESSAGE_KEYS);
  if (msg) return msg;
  try {
    return JSON.stringify(row);
  } catch {
    return String(row);
  }
}

function buildExtraFieldsJson(row: LogInfluxRow): string | null {
  const used = new Set([...TIME_KEYS, ...LEVEL_KEYS, ...MESSAGE_KEYS]);
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (used.has(k)) continue;
    rest[k] = v;
  }
  if (Object.keys(rest).length === 0) return null;
  try {
    return JSON.stringify(rest, null, 2);
  } catch {
    return null;
  }
}

/** JSON formateado de campos extra (sin truncar). */
export function logRowExtraJson(row: LogInfluxRow): string {
  const s = buildExtraFieldsJson(row);
  return s == null ? '—' : s;
}

/**
 * Convierte secuencias tipo JSON (`\n`, `\r\n`) y literales frecuentes en saltos de línea reales
 * para pantalla y Excel.
 */
export function formatLogMultilineText(text: string): string {
  if (text == null || text === '') return '';
  if (text === '—') return '—';
  return text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/** Campos adicionales (excluye los ya usados en tiempo/nivel/mensaje típicos), truncado para tablas compactas. */
export function logRowExtraSummary(row: LogInfluxRow, maxLen = 240): string {
  const s = buildExtraFieldsJson(row);
  if (s == null) return '—';
  const compact = s.replace(/\n/g, ' ');
  return compact.length > maxLen ? `${compact.slice(0, maxLen)}…` : compact;
}
