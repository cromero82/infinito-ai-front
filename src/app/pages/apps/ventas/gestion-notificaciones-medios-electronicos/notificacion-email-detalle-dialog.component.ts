import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import {
  GestionNotificacionesMediosService,
  NotificacionEmailPagoDto,
  PlantillaNotificacionPagoDto
} from '../service/gestion-notificaciones-medios.service';
import { OrigenFondosArbolItemDto } from '../../financiero/origenes-fondos/util/origen-fondos-arbol.util';

const CLASIFICACIONES: { value: string; label: string }[] = [
  { value: 'VALE_EMPLEADO', label: 'Vale / préstamo empleado' },
  { value: 'ANTICIPO_SALARIO', label: 'Anticipo de salario' },
  { value: 'CUENTA_PERSONAL', label: 'Cuenta personal administrador' },
  { value: 'GASTO_NEGOCIO', label: 'Gasto del negocio' },
  { value: 'OTRO_LEGALIZADO', label: 'Otro (legalizado)' }
];

export interface NotificacionEmailDetalleData extends NotificacionEmailPagoDto {
  origenesArbol?: OrigenFondosArbolItemDto[];
  plantillas?: PlantillaNotificacionPagoDto[];
}

@Component({
  selector: 'app-notificacion-email-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.asunto || 'Notificación' }}</h2>
    <mat-dialog-content class="detalle">
      @if (data.plantillaNombre || data.plantillaIcono) {
        <p class="plantilla-row">
          @if (data.plantillaIcono) {
            <img [src]="iconoUrl(data.plantillaIcono)" alt="" width="28" height="28" />
          }
          <strong>{{ data.plantillaNombre || 'Plantilla' }}</strong>
        </p>
      }
      <p><strong>Recibido:</strong> {{ data.recibidoEn | date: 'dd/MM/yyyy HH:mm:ss' }}</p>
      <p><strong>Ciclo de vista:</strong> {{ labelCicloVista(data.estadoVista) }}</p>
      <p><strong>Vínculo operación:</strong> {{ labelVinculo() }}</p>
      <p>
        <strong>Monto:</strong>
        {{
          data.monto != null
            ? (data.monto | currency: 'COP' : 'symbol-narrow' : '1.0-0')
            : '—'
        }}
      </p>
      <p><strong>Pagador:</strong> {{ data.nombrePagador || '—' }}</p>
      <p><strong>Cuenta:</strong> {{ data.referenciaCuenta || '—' }}</p>
      @if (data.clasificacion) {
        <p>
          <strong>Clasificación:</strong> {{ data.clasificacion }}
          @if (data.clasificacionObservacion) {
            — {{ data.clasificacionObservacion }}
          }
        </p>
      }

      @if (!data.clasificacion && puedeMostrarLegalizar) {
        <div class="legalizar-box">
          <h3>Legalizar movimiento</h3>
          <p class="hint">
            Saca el saldo de la bolsa «Sin Clasificar» (u otra bolsa por identificar)
            y lo traslada al origen de fondos de responsabilidad. El correo queda
            auditado; archivar no borra el movimiento.
          </p>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Clasificación</mat-label>
            <mat-select
              [(ngModel)]="clasificacion"
              (selectionChange)="onClasificacionChange()">
              @for (c of clasificaciones; track c.value) {
                <mat-option [value]="c.value">{{ c.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Destino OF</mat-label>
            <mat-select [(ngModel)]="destinoOfId">
              <mat-option [value]="null">— Sugerido automático —</mat-option>
              @for (o of destinosOf; track o.id) {
                <mat-option [value]="o.id">{{ o.nombreDisplay || o.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <p class="hint destino-hint">{{ hintDestino }}</p>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Observación (opcional)</mat-label>
            <input matInput [(ngModel)]="observacion" />
          </mat-form-field>
          @if (error) {
            <p class="error">{{ error }}</p>
          }
        </div>
      }

      <h3 class="cuerpo-title">Mensaje completo (original)</h3>
      <pre class="cuerpo">{{
        data.cuerpoRaw || data.cuerpoTexto || "(sin cuerpo)"
      }}</pre>
      @if (data.cuerpoRaw && data.cuerpoTexto && data.cuerpoRaw !== data.cuerpoTexto) {
        <details class="cuerpo-extraido">
          <summary>Vista extraída (sin vínculos / filtrada)</summary>
          <pre class="cuerpo cuerpo--secundario">{{ data.cuerpoTexto }}</pre>
        </details>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cerrar</button>
      @if (!data.clasificacion && puedeMostrarLegalizar) {
        <button
          mat-flat-button
          color="primary"
          type="button"
          [disabled]="!clasificacion || saving || !puedeLegalizar"
          (click)="legalizar()">
          Legalizar y mover OF
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [
    `
      .detalle {
        max-width: 640px;
      }
      .plantilla-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .plantilla-row img {
        width: 28px;
        height: 28px;
        object-fit: contain;
      }
      .legalizar-box {
        margin: 12px 0;
        padding: 10px 12px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 8px;
        background: rgba(63, 81, 181, 0.04);
      }
      .legalizar-box h3 {
        margin: 0 0 4px;
        font-size: 0.9rem;
      }
      .hint {
        margin: 0 0 8px;
        font-size: 0.75rem;
        opacity: 0.75;
      }
      .destino-hint {
        margin-top: -4px;
      }
      .full {
        width: 100%;
      }
      .error {
        color: #c62828;
        font-size: 0.8rem;
      }
      .cuerpo {
        white-space: pre-wrap;
        word-break: break-word;
        background: #f4f5f7;
        padding: 12px;
        border-radius: 8px;
        font-size: 13px;
        max-height: 40vh;
        overflow: auto;
        user-select: text;
      }
      .cuerpo-title {
        margin: 12px 0 6px;
        font-size: 0.85rem;
      }
      .cuerpo-extraido {
        margin-top: 10px;
        font-size: 0.8rem;
      }
      .cuerpo--secundario {
        max-height: 20vh;
        opacity: 0.85;
      }
    `
  ]
})
export class NotificacionEmailDetalleDialogComponent implements OnInit {
  clasificaciones = CLASIFICACIONES;
  clasificacion = '';
  observacion = '';
  destinoOfId: number | null = null;
  destinosOf: OrigenFondosArbolItemDto[] = [];
  saving = false;
  error: string | null = null;
  hintDestino = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: NotificacionEmailDetalleData,
    private dialogRef: MatDialogRef<NotificacionEmailDetalleDialogComponent>,
    private api: GestionNotificacionesMediosService
  ) {
    this.clasificacion = data.clasificacion || '';
    this.observacion = data.clasificacionObservacion || '';
  }

  ngOnInit(): void {
    this.destinosOf = (this.data.origenesArbol || []).filter(
      (o) => !this.esBolsaPorIdentificar(o)
    );
    if (this.clasificacion) {
      this.onClasificacionChange();
    }
  }

  get puedeLegalizar(): boolean {
    if (!this.clasificacion) {
      return false;
    }
    if (this.clasificacion === 'GASTO_NEGOCIO' && this.destinoOfId == null) {
      return false;
    }
    return true;
  }

  get puedeMostrarLegalizar(): boolean {
    const v = (this.data.vinculoOperacion || '').toUpperCase();
    return v !== 'NO_APLICA' && v !== 'ASOCIADA';
  }

  labelCicloVista(valor?: string | null): string {
    switch ((valor || '').toUpperCase()) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'MOSTRADA':
        return 'Mostrada';
      case 'ARCHIVADA':
        return 'Archivada';
      default:
        return valor || '—';
    }
  }

  labelVinculo(): string {
    switch ((this.data.vinculoOperacion || '').toUpperCase()) {
      case 'NO_APLICA':
        return 'No aplica';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'ASOCIADA':
        if (this.data.egresoId != null) {
          return `Egreso #${this.data.egresoId}`;
        }
        if (this.data.historialReciboElectronicoId != null) {
          return 'Ticket / abono';
        }
        return 'Asociada';
      default:
        return this.data.vinculoOperacion || '—';
    }
  }

  iconoUrl(filename?: string | null): string {
    if (!filename) {
      return '';
    }
    // Iconos de método de pago viven en assets del FE (mismo file que tickets)
    if (filename.endsWith('.png') || filename.endsWith('.svg') || filename.endsWith('.webp')) {
      return `assets/img/icons/payments/${filename}`;
    }
    return this.api.iconoUrl(filename);
  }

  onClasificacionChange(): void {
    const sugerido = this.sugerirDestino(this.clasificacion);
    this.destinoOfId = sugerido?.id ?? null;
    this.hintDestino = this.buildHint(this.clasificacion, sugerido);
  }

  private esBolsaPorIdentificar(o: OrigenFondosArbolItemDto): boolean {
    const n = (o.nombre || '').toLowerCase();
    return n.includes('sin clasificar') || n.includes('para ordenar') || n.includes('por identificar');
  }

  private sugerirDestino(clasificacion: string): OrigenFondosArbolItemDto | null {
    const list = this.destinosOf;
    const findExact = (name: string) =>
      list.find((o) => (o.nombre || '').toLowerCase() === name.toLowerCase()) ||
      null;
    const findLike = (part: string) =>
      list.find((o) => (o.nombre || '').toLowerCase().includes(part.toLowerCase())) ||
      null;
    switch (clasificacion) {
      case 'CUENTA_PERSONAL':
        return findExact('Cuenta del dueño') || findExact('Personal administrador') || findLike('dueño') || findLike('personal');
      case 'ANTICIPO_SALARIO':
        return findExact('Bolsillo Nómina') || findLike('nómina') || findLike('nomina');
      case 'VALE_EMPLEADO':
        return (
          findExact('Bolsillo Nómina') ||
          findExact('Cuenta del dueño') ||
          findExact('Personal administrador') ||
          findLike('nómina') ||
          findLike('nomina')
        );
      case 'GASTO_NEGOCIO':
        return findLike('arriendo') || findLike('gasto');
      default:
        return null;
    }
  }

  private buildHint(
    clasificacion: string,
    sugerido: OrigenFondosArbolItemDto | null
  ): string {
    const bolsa = this.nombreBolsaOrigen();
    if (clasificacion === 'GASTO_NEGOCIO') {
      return sugerido
        ? `Traslado: ${bolsa} → ${sugerido.nombreDisplay || sugerido.nombre}. Puede cambiar el destino.`
        : `Elija el OF de gasto (p.ej. Arriendo). Sale de ${bolsa}.`;
    }
    if (clasificacion === 'OTRO_LEGALIZADO') {
      return sugerido
        ? `Opcional: mover de ${bolsa} a ${sugerido.nombreDisplay || sugerido.nombre}.`
        : `Opcional: elija destino OF, o solo clasifique sin mover.`;
    }
    if (sugerido) {
      return `Traslado: ${bolsa} → ${sugerido.nombreDisplay || sugerido.nombre}`;
    }
    return `Seleccione destino OF (salida desde ${bolsa}).`;
  }

  private nombreBolsaOrigen(): string {
    const plantilla = (this.data.plantillas || []).find(
      (p) => p.id === this.data.plantillaNotificacionId
    );
    const destinoId = plantilla?.origenFondosDestinoId;
    if (destinoId != null) {
      const of = (this.data.origenesArbol || []).find((o) => o.id === destinoId);
      if (of) {
        return of.nombreDisplay || of.nombre;
      }
    }
    const paraOrdenar = (this.data.origenesArbol || []).find((o) =>
      (o.nombre || '').toLowerCase().includes('sin clasificar') ||
      (o.nombre || '').toLowerCase().includes('para ordenar')
    );
    return paraOrdenar?.nombreDisplay || paraOrdenar?.nombre || 'Sin Clasificar';
  }

  legalizar(): void {
    if (!this.clasificacion || !this.puedeLegalizar) {
      return;
    }
    this.saving = true;
    this.error = null;
    this.api
      .legalizar(
        this.data.id,
        this.clasificacion,
        this.observacion || undefined,
        this.destinoOfId ?? undefined
      )
      .subscribe({
        next: (updated) => {
          this.saving = false;
          this.dialogRef.close(updated);
        },
        error: (err) => {
          this.saving = false;
          this.error =
            err?.error?.message ||
            err?.message ||
            'No se pudo legalizar la notificación.';
        }
      });
  }
}
