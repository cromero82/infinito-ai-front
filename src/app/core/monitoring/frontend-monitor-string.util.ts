import { FRONTEND_MONITOR_MAX_JSON_CHARS } from './frontend-monitor.constants';

/**
 * Acorta texto o JSON serializado para el buffer de actividad y el cuerpo de reporte.
 */
export function truncarParaMonitoreo(value: string, max = FRONTEND_MONITOR_MAX_JSON_CHARS): string {
  const s = value ?? '';
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, max)}…[truncado ${s.length - max} chars]`;
}
