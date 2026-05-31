// Host por el que el navegador abrió la app (localhost o IP de LAN). Los backends
// corren en la misma máquina, así que reutilizamos ese host para llamarlos.
const apiHost =
  typeof window !== 'undefined' && window.location?.hostname
    ? window.location.hostname
    : 'localhost';

export const environment = {
  production: true,
  builderApiKey: '06e0922284dc424bb6ca15d07296678f',
  apiHost,
  apiUrlRelationalDb: `http://${apiHost}:8088`,
  apiUrlAuth: `http://${apiHost}:8081`,
  localStorageKeyEstadosRecibos: 'estados_recibos',
  /** Si true, no envía errores a POST /reporte-frontend. */
  reporteFrontendDeshabilitado: false
};
