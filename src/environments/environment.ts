// https://www.builder.io/c/docs/using-your-api-key

// Host por el que el navegador abrió la app (localhost en la Mac, o la IP de LAN
// como 192.168.1.6 cuando se accede desde un celular en la misma red). Los backends
// corren en la misma máquina, así que reutilizamos ese host para llamarlos.
const apiHost =
  typeof window !== 'undefined' && window.location?.hostname
    ? window.location.hostname
    : 'localhost';

export const environment = {
  production: false,
  builderApiKey: '06e0922284dc424bb6ca15d07296678f',
  apiHost,
  apiUrlRelationalDb: `http://${apiHost}:8088`,
  apiUrlAuth: `http://${apiHost}:8081`,
  localStorageKeyEstadosRecibos: 'estados_recibos',
  /** Si true, no envía errores a POST /reporte-frontend. */
  reporteFrontendDeshabilitado: false
};
