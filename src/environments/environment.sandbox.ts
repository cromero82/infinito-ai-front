// Sandbox (tester) — Angular :4210 / Caddy :8180 / túnel pos-sandbox.mayaksoluciones.com
//
//  - Dev server sandbox (`:4210`): habla directo con MS sandbox :8181 / :8188 / :8195.
//  - Túnel o Caddy (`:8180` / HTTPS 443): rutas relativas → Caddyfile.sandbox.
const loc = typeof window !== 'undefined' ? window.location : undefined;
const apiHost = loc?.hostname || 'localhost';
const isSandboxDevServer = loc?.port === '4210';

export const environment = {
  production: false,
  sandbox: true,
  builderApiKey: '06e0922284dc424bb6ca15d07296678f',
  apiHost,
  apiUrlRelationalDb: isSandboxDevServer ? `http://${apiHost}:8188` : '',
  apiUrlAuth: isSandboxDevServer ? `http://${apiHost}:8181` : '',
  apiUrlPuenteTienda: isSandboxDevServer ? `http://${apiHost}:8195` : '',
  localStorageKeyEstadosRecibos: 'estados_recibos_sandbox',
  reporteFrontendDeshabilitado: false
};
