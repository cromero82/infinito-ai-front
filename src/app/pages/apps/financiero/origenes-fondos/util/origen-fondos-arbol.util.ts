export interface OrigenFondosArbolItemDto {
  id: number;
  nombre: string;
  nombreDisplay: string;
  nivel: number;
  parentOrigenFondosId?: number | null;
  metodoPagoId?: number | null;
  tipoOrigenFondosNombre?: string;
  tipoOrigenFondosCodigo?: string;
  esRaiz?: boolean;
  visibleEnEgreso?: boolean;
  color?: string | null;
  orden?: number;
  saldo?: number;
  /** FISICA | ELECTRONICA | MIXTA */
  naturaleza?: string | null;
}

export interface GrupoOrigenFondos {
  raiz: OrigenFondosArbolItemDto;
  hijos: OrigenFondosArbolItemDto[];
}

/** Vista de saldo: ledger + ventas del período abierto (sin corte). */
export interface SaldoOfVista {
  ledger: number;
  ventasSinCorte: number;
  parcial: number;
  mostrarDesglose: boolean;
}

export function agruparOrigenesArbol(
  items: OrigenFondosArbolItemDto[]
): GrupoOrigenFondos[] {
  const hijosPorPadre = new Map<number, OrigenFondosArbolItemDto[]>();
  const raices: OrigenFondosArbolItemDto[] = [];

  for (const item of items) {
    if (item.nivel === 0 || item.esRaiz) {
      raices.push(item);
      continue;
    }
    const padreId = item.parentOrigenFondosId;
    if (padreId != null) {
      const lista = hijosPorPadre.get(padreId) ?? [];
      lista.push(item);
      hijosPorPadre.set(padreId, lista);
    }
  }

  return raices.map((raiz) => ({
    raiz,
    hijos: hijosPorPadre.get(raiz.id) ?? []
  }));
}

export function mapVentasSinCortePorMetodo(
  ventasTipo?:
    | {
        metodoPagoId: number;
        totalVentasSistema?: number;
      }[]
    | null
): Map<number, number> {
  const map = new Map<number, number>();
  if (!ventasTipo?.length) {
    return map;
  }
  for (const vt of ventasTipo) {
    const ventas = Number(vt.totalVentasSistema ?? 0);
    if (vt.metodoPagoId != null && !Number.isNaN(ventas)) {
      map.set(vt.metodoPagoId, ventas);
    }
  }
  return map;
}

/**
 * Raíces con método de pago: ledger + ventas sin corte.
 * Hijos y cuentas sin MP no suman tickets (solo ledger).
 * Los egresos del período ya están en el ledger; no se restan de nuevo.
 */
export function saldoOrigenConVentasSinCorte(
  cuenta: OrigenFondosArbolItemDto,
  ventasSinCortePorMetodo: Map<number, number>
): SaldoOfVista {
  const ledger = cuenta.saldo ?? 0;
  const aplica =
    (cuenta.esRaiz === true || cuenta.nivel === 0) &&
    cuenta.metodoPagoId != null;
  const ventasSinCorte = aplica
    ? (ventasSinCortePorMetodo.get(cuenta.metodoPagoId!) ?? 0)
    : 0;
  return {
    ledger,
    ventasSinCorte,
    parcial: ledger + ventasSinCorte,
    mostrarDesglose: aplica && ventasSinCorte !== 0
  };
}

export function etiquetaOrigenConSaldo(
  item: OrigenFondosArbolItemDto,
  formatSaldo: (n: number) => string,
  saldo?: number
): string {
  const valor = saldo ?? item.saldo ?? 0;
  return `${item.nombreDisplay} (${formatSaldo(valor)})`;
}

/** Params de fecha local para consultar-rango (último corte → ahora). */
export function paramsConsultarRangoHastaAhora(ahora: Date = new Date()): {
  fechaIni: string;
  fechaFin: string;
  ultimoCorte: boolean;
  actual: boolean;
} {
  return {
    fechaIni: construirFechaHoraISOLocal(ahora, '00:00'),
    fechaFin: construirFechaHoraISOLocal(ahora, horaActualHHMM(ahora)),
    ultimoCorte: true,
    actual: true
  };
}

function construirFechaHoraISOLocal(fecha: Date, hora: string): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  const [hhRaw, mmRaw] = hora.split(':');
  const hh = String(hhRaw ?? '00').padStart(2, '0');
  const mm = String(mmRaw ?? '00').padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}:00`;
}

function horaActualHHMM(fecha: Date): string {
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mm = String(fecha.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
