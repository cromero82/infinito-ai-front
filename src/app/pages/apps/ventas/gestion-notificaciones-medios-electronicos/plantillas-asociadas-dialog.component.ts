import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../../core/components/confirm-dialog/confirm-dialog.component';
import {
  GestionNotificacionesMediosService,
  PlantillaNotificacionPagoDto
} from '../service/gestion-notificaciones-medios.service';
import { MetodoPagoDto, MetodoPagoService } from '../service/metodo-pago.service';
import { PlantillaNotificacionFormDialogComponent } from './plantilla-notificacion-form-dialog.component';

export interface PlantillasAsociadasDialogData {
  /** Si viene, resalta/filtra por ese medio (opcional). */
  metodoPagoId?: number | null;
  metodoPagoDescripcion?: string | null;
}

@Component({
  selector: 'app-plantillas-asociadas-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="head flex items-start justify-between gap-3 px-1 pt-1">
      <div class="min-w-0">
        <h2 mat-dialog-title class="!m-0 !p-0">Plantillas asociadas</h2>
        <p class="m-0 mt-1 text-sm text-secondary">
          @if (data.metodoPagoDescripcion) {
            Extracción de email · foco en «{{ data.metodoPagoDescripcion }}»
          } @else {
            Plantillas de extracción (Ingreso / Egreso)
          }
        </p>
      </div>
      <button mat-flat-button color="primary" type="button" (click)="nueva()">
        <mat-icon svgIcon="mat:add" class="ltr:mr-1 rtl:ml-1"></mat-icon>
        Agregar
      </button>
    </div>
    <mat-dialog-content>
      @if (loading) {
        <div class="flex justify-center py-10">
          <mat-spinner diameter="36"></mat-spinner>
        </div>
      } @else if (!rows.length) {
        <p class="empty text-secondary text-sm py-8 text-center">No hay plantillas.</p>
      } @else {
        <table mat-table [dataSource]="rows" class="w-full tpl-table">
          <ng-container matColumnDef="icono">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              @if (iconoPlantilla(row); as ico) {
                <img [src]="ico" alt="" width="28" height="28" class="ico" />
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let row" class="font-medium">{{ row.nombre }}</td>
          </ng-container>
          <ng-container matColumnDef="naturaleza">
            <th mat-header-cell *matHeaderCellDef>Naturaleza</th>
            <td mat-cell *matCellDef="let row">{{ row.naturaleza || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="metodo">
            <th mat-header-cell *matHeaderCellDef>Método</th>
            <td mat-cell *matCellDef="let row">{{ labelMetodo(row.metodoPagoId) }}</td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="acciones">
              <button
                mat-icon-button
                type="button"
                matTooltip="Modificar"
                (click)="editar(row)">
                <mat-icon svgIcon="mat:edit"></mat-icon>
              </button>
              <button
                mat-icon-button
                type="button"
                color="warn"
                matTooltip="Eliminar"
                (click)="eliminar(row)">
                <mat-icon svgIcon="mat:delete"></mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: cols"
            [class.row-focus]="data.metodoPagoId != null && row.metodoPagoId === data.metodoPagoId"></tr>
        </table>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="ref.close(changed)">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .text-secondary {
        color: var(--vex-foreground-secondary, rgba(0, 0, 0, 0.54));
      }
      .head {
        padding: 8px 8px 0;
      }
      .ico {
        object-fit: contain;
        display: block;
      }
      .acciones {
        white-space: nowrap;
        text-align: right;
      }
      .row-focus {
        background: rgba(25, 118, 210, 0.06);
      }
      mat-dialog-content {
        min-width: min(720px, 94vw);
        max-height: min(60vh, 520px);
      }
      table.tpl-table {
        font-size: 13px;
      }
    `
  ]
})
export class PlantillasAsociadasDialogComponent implements OnInit {
  cols = ['icono', 'nombre', 'naturaleza', 'metodo', 'acciones'];
  rows: PlantillaNotificacionPagoDto[] = [];
  loading = true;
  changed = false;
  private metodosPorId = new Map<number, MetodoPagoDto>();

  constructor(
    public ref: MatDialogRef<PlantillasAsociadasDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: PlantillasAsociadasDialogData,
    private api: GestionNotificacionesMediosService,
    private metodoPagoService: MetodoPagoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.metodoPagoService.obtenerMetodosPago().subscribe({
      next: (list) => {
        this.metodosPorId = new Map((list || []).map((m) => [m.id, m]));
      }
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.listarPlantillas().subscribe({
      next: (list) => {
        const all = list || [];
        // Todas visibles; si hay foco, las del método primero
        const focus = this.data.metodoPagoId;
        this.rows = [...all].sort((a, b) => {
          if (focus != null) {
            const aF = a.metodoPagoId === focus ? 0 : 1;
            const bF = b.metodoPagoId === focus ? 0 : 1;
            if (aF !== bF) {
              return aF - bF;
            }
          }
          return (a.orden || 0) - (b.orden || 0) || a.id - b.id;
        });
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.snackBar.open('No se pudieron cargar las plantillas', 'Cerrar', { duration: 4000 });
      }
    });
  }

  labelMetodo(id?: number | null): string {
    if (id == null) {
      return '—';
    }
    return this.metodosPorId.get(id)?.descripcion || `#${id}`;
  }

  iconoPlantilla(p: PlantillaNotificacionPagoDto): string {
    const mp = p.metodoPagoId != null ? this.metodosPorId.get(p.metodoPagoId) : null;
    if (mp?.file) {
      return this.metodoPagoService.iconoUrl(mp.file);
    }
    return '';
  }

  nueva(): void {
    const ref = this.dialog.open(PlantillaNotificacionFormDialogComponent, {
      width: '560px',
      maxWidth: '96vw',
      autoFocus: false,
      data: {
        plantilla: null,
        metodoPagoIdPrefill: this.data.metodoPagoId ?? null
      }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.changed = true;
        this.load();
      }
    });
  }

  editar(row: PlantillaNotificacionPagoDto): void {
    const ref = this.dialog.open(PlantillaNotificacionFormDialogComponent, {
      width: '560px',
      maxWidth: '96vw',
      autoFocus: false,
      data: { plantilla: { ...row } }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.changed = true;
        this.load();
      }
    });
  }

  eliminar(row: PlantillaNotificacionPagoDto): void {
    const conf = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Eliminar plantilla',
        mensaje: `¿Eliminar la plantilla <b>${row.nombre}</b>?`
      } as ConfirmDialogData
    });
    conf.afterClosed().subscribe((ok) => {
      if (!ok) {
        return;
      }
      this.api.eliminarPlantilla(row.id).subscribe({
        next: () => {
          this.changed = true;
          this.snackBar.open('Plantilla eliminada', 'Cerrar', { duration: 2500 });
          this.load();
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          this.snackBar.open(
            err?.error?.message || err?.message || 'No se pudo eliminar',
            'Cerrar',
            { duration: 4000 }
          );
        }
      });
    });
  }
}
