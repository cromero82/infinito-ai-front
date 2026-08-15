/** Textos visibles al usuario (el código interno sigue siendo bug-reporter). */
export const MONITOR_BUTTON_LABEL = 'Monitor';

/** Key en `configuracion-app` / localStorage. En BD: `{"mostrar":true|false}`. */
export const MONITOR_BUG_CONFIG_KEY = 'monitor-bug';

/** Visible solo si localStorage tiene `monitor-bug=true` (cargado al iniciar sesión). */
export function isMonitorBugEnabled(): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  return localStorage.getItem(MONITOR_BUG_CONFIG_KEY) === 'true';
}