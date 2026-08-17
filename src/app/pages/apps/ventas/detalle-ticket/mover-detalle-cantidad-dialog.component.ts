import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface MoverDetalleCantidadLinea {
  detalleId: number;
  productoNombre: string;
  cantidadActual: number;
  /** Cantidad a mover (editable; 1..cantidadActual). */
  cantidadMover: number;
}

export interface MoverDetalleCantidadDialogData {
  lineas: MoverDetalleCantidadLinea[];
  destinoLabel?: string;
}

export interface MoverDetalleCantidadDialogResult {
  /** detalleId → unidades a mover */
  cantidades: Record<number, number>;
}

@Component({
  selector: 'vex-mover-detalle-cantidad-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>Confirmar movimiento</h2>
    <mat-dialog-content>
      <p class="hint">
        Indica cuántas unidades mover
        @if (data.destinoLabel) {
          a <strong>{{ data.destinoLabel }}</strong>
        }
        y cuántas quedan en el ticket actual.
      </p>

      @for (linea of lineas; track linea.detalleId) {
        <div class="linea">
          <div class="nombre" [title]="linea.productoNombre">
            {{ linea.productoNombre }}
          </div>
          <div class="grid">
            <div class="campo">
              <span class="label">Actual</span>
              <span class="valor">{{ linea.cantidadActual }}</span>
            </div>
            <mat-form-field appearance="outline" class="campo-input" subscriptSizing="dynamic">
              <mat-label>Mover</mat-label>
              <input
                matInput
                type="number"
                min="1"
                [max]="linea.cantidadActual"
                [(ngModel)]="linea.cantidadMover"
                (ngModelChange)="clampLinea(linea)" />
            </mat-form-field>
            <div class="campo">
              <span class="label">Quedan</span>
              <span class="valor quedan">{{ quedan(linea) }}</span>
            </div>
          </div>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancelar()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="!esValido"
        (click)="confirmar()">
        Mover
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .hint {
        margin: 0 0 1rem;
        color: rgba(0, 0, 0, 0.62);
        font-size: 0.9rem;
        line-height: 1.35;
      }

      .linea {
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }

      .linea:last-child {
        border-bottom: none;
        padding-bottom: 0.25rem;
      }

      .nombre {
        font-weight: 600;
        margin-bottom: 0.5rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .grid {
        display: grid;
        grid-template-columns: 72px minmax(100px, 1fr) 72px;
        gap: 0.75rem;
        align-items: center;
      }

      .campo {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      .label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: rgba(0, 0, 0, 0.5);
      }

      .valor {
        font-size: 1.1rem;
        font-weight: 600;
      }

      .quedan {
        color: rgb(var(--vex-color-primary-600, 63 81 181));
      }

      .campo-input {
        width: 100%;
      }

      mat-dialog-content {
        min-width: min(420px, 92vw);
      }
    `
  ]
})
export class MoverDetalleCantidadDialogComponent {
  lineas: MoverDetalleCantidadLinea[];

  constructor(
    private readonly dialogRef: MatDialogRef<
      MoverDetalleCantidadDialogComponent,
      MoverDetalleCantidadDialogResult | undefined
    >,
    @Inject(MAT_DIALOG_DATA) public data: MoverDetalleCantidadDialogData
  ) {
    this.lineas = (data.lineas ?? []).map((l) => ({
      ...l,
      cantidadMover: this.clamp(
        Number(l.cantidadMover ?? l.cantidadActual),
        1,
        Number(l.cantidadActual)
      )
    }));
  }

  quedan(linea: MoverDetalleCantidadLinea): number {
    return Math.max(
      0,
      Number(linea.cantidadActual) - Number(linea.cantidadMover || 0)
    );
  }

  clampLinea(linea: MoverDetalleCantidadLinea): void {
    linea.cantidadMover = this.clamp(
      Number(linea.cantidadMover),
      1,
      Number(linea.cantidadActual)
    );
  }

  get esValido(): boolean {
    return this.lineas.every((l) => {
      const mover = Number(l.cantidadMover);
      return (
        Number.isFinite(mover) &&
        mover >= 1 &&
        mover <= Number(l.cantidadActual)
      );
    });
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  confirmar(): void {
    if (!this.esValido) {
      return;
    }
    const cantidades: Record<number, number> = {};
    for (const l of this.lineas) {
      cantidades[l.detalleId] = Number(l.cantidadMover);
    }
    this.dialogRef.close({ cantidades });
  }

  private clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
      return min;
    }
    return Math.min(max, Math.max(min, Math.round(value)));
  }
}
