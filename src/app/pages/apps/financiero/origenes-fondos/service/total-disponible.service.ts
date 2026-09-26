import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { OrigenFondosService } from './origen-fondos.service';
import {
  ConsultarRangoCorteDto,
  CorteVentaService,
  VentaTipoCorteDto
} from '../../../ventas/service/corte-venta.service';
import {
  OrigenFondosArbolItemDto,
  mapVentasSinCortePorMetodo,
  paramsConsultarRangoHastaAhora,
  saldoOrigenConVentasSinCorte
} from '../util/origen-fondos-arbol.util';
import { FooterItemDto } from '../../../../../layouts/components/footer/footer.component';

/** Los cuatro indicadores del turno: encabezan el Cierre de turno y van al footer. */
export interface TotalDisponibleDetalle {
  /** Todo lo recibido en el turno: ventas de tickets + cobranzas CxC, todos los medios. */
  ventasTurno: number;
  /** Efectivo: caja registradora + caja menor + caja general + cualquier otra caja física. */
  efectivoDisponible: number;
  /** Medios electrónicos (Bancolombia QR, Nequi, …). */
  mediosElectronicos: number;
  /** Suma de los dos anteriores. */
  totalDisponible: number;
}

/** Etiquetas únicas de los indicadores; se usan en el cierre de turno y en el footer. */
export const LABEL_VENTAS_TURNO = 'Ventas turno';
export const LABEL_EFECTIVO_DISPONIBLE = 'Efectivo disponible';
export const LABEL_MEDIOS_ELECTRONICOS = 'Dinero medios electrónicos';
export const LABEL_TOTAL_DISPONIBLE = 'Total dinero disponible';

const NATURALEZA_FISICA = 'FISICA';
const TIPO_DUENOS = 'DUENOS';

function normalizar(valor?: string | null): string {
  return (valor || '').trim().toUpperCase();
}

function redondear(valor: unknown): number {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * Indicadores del turno: ventas, efectivo, medios electrónicos y el total. El dinero
 * disponible sale del ledger de los orígenes de fondos más las ventas del turno abierto
 * (todavía sin corte).
 *
 * Son los mismos indicadores que encabezan el Cierre de turno, pero calculados solo desde
 * saldos: fuera del diálogo de cierre no hay conteo del cajero, así que la caja registradora
 * entra por su saldo de sistema en vez de por el Real contado. Cuando el cajero cuadra la
 * caja ambas cifras coinciden; mientras el turno está abierto esta es la única que existe.
 */
@Injectable({ providedIn: 'root' })
export class TotalDisponibleService {
  constructor(
    private readonly origenFondosService: OrigenFondosService,
    private readonly corteVentaService: CorteVentaService
  ) {}

  /**
   * Consulta el árbol de orígenes y las ventas sin corte, y devuelve el desglose.
   * Si falla la consulta de rango se calcula solo con el ledger (sin ventas del turno).
   */
  consultar(): Observable<TotalDisponibleDetalle> {
    return forkJoin({
      arbol: this.origenFondosService
        .findArbol()
        .pipe(catchError(() => of([] as OrigenFondosArbolItemDto[]))),
      rango: this.corteVentaService
        .consultarRango(paramsConsultarRangoHastaAhora())
        .pipe(catchError(() => of(null as ConsultarRangoCorteDto | null)))
    }).pipe(map(({ arbol, rango }) => this.calcular(arbol, rango?.ventasTipo)));
  }

  /**
   * Desglose a partir de datos ya cargados, para las pantallas que igual consultan el árbol
   * (Orígenes de fondos) y no deben pedirlo dos veces.
   */
  calcular(
    arbol: OrigenFondosArbolItemDto[],
    ventasTipo?: VentaTipoCorteDto[] | null
  ): TotalDisponibleDetalle {
    const ventasSinCortePorMetodo = mapVentasSinCortePorMetodo(ventasTipo);
    let efectivoDisponible = 0;
    let mediosElectronicos = 0;

    for (const origen of arbol ?? []) {
      if (!this.esOperativo(origen)) {
        continue;
      }
      const saldo = redondear(
        saldoOrigenConVentasSinCorte(origen, ventasSinCortePorMetodo).parcial
      );
      if (this.esEfectivo(origen)) {
        efectivoDisponible += saldo;
      } else {
        mediosElectronicos += saldo;
      }
    }

    return {
      ventasTurno: this.ventasTurno(ventasTipo),
      efectivoDisponible,
      mediosElectronicos,
      totalDisponible: efectivoDisponible + mediosElectronicos
    };
  }

  /** Ventas del turno: tickets + cobranzas CxC de todos los medios, sin corte todavía. */
  private ventasTurno(ventasTipo?: VentaTipoCorteDto[] | null): number {
    return (ventasTipo ?? []).reduce(
      (acc, vt) =>
        acc + redondear(vt.totalVentasSistema) + redondear(vt.totalCobranzasSistema),
      0
    );
  }

  /**
   * Efectivo físico. Lo demás (ELECTRONICA, MIXTA o sin naturaleza declarada) cuenta como
   * medio electrónico, para que ningún origen quede fuera del total.
   */
  esEfectivo(origen: OrigenFondosArbolItemDto): boolean {
    return normalizar(origen.naturaleza) === NATURALEZA_FISICA;
  }

  /**
   * Cajas físicas que no son medio de pago: Caja Menor, Caja General y cualquiera que se
   * agregue después. El cierre de turno las suma aparte, porque no se cuentan billete a
   * billete pero sí son dinero disponible.
   */
  saldoOtrasCajasFisicas(arbol: OrigenFondosArbolItemDto[]): number {
    return (arbol ?? [])
      .filter((origen) => this.esEfectivo(origen))
      .filter((origen) => origen.metodoPagoId == null)
      .filter((origen) => this.esOperativo(origen))
      .reduce((acc, origen) => acc + redondear(origen.saldo), 0);
  }

  /**
   * Los cuatro indicadores listos para `FooterService.setFooterItems`, en el mismo orden
   * en que se leen en el encabezado del Cierre de turno.
   */
  footerItems(detalle: TotalDisponibleDetalle): FooterItemDto[] {
    return [
      {
        textoClave: LABEL_VENTAS_TURNO,
        valorClave: this.formatCurrency(detalle.ventasTurno),
        estiloCssClave: ''
      },
      {
        textoClave: LABEL_EFECTIVO_DISPONIBLE,
        valorClave: this.formatCurrency(detalle.efectivoDisponible),
        estiloCssClave: ''
      },
      {
        textoClave: LABEL_MEDIOS_ELECTRONICOS,
        valorClave: this.formatCurrency(detalle.mediosElectronicos),
        estiloCssClave: ''
      },
      {
        textoClave: LABEL_TOTAL_DISPONIBLE,
        valorClave: this.formatCurrency(detalle.totalDisponible),
        estiloCssClave: 'footer-item-total-highlight'
      }
    ];
  }

  formatCurrency(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor ?? 0);
  }

  /** Las cajas de dueños no son dinero operativo de la tienda. */
  private esOperativo(origen: OrigenFondosArbolItemDto): boolean {
    return normalizar(origen.tipoOrigenFondosCodigo) !== TIPO_DUENOS;
  }
}
