import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface TicketObservacionDialogData {
  nombreTicket: string;
  observaciones: string;
}

@Component({
  selector: 'vex-ticket-observacion-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ esEdicion ? 'Editar comentario' : 'Agregar comentario' }}
    </h2>
    <mat-dialog-content>
      <p class="hint">Ticket «{{ data.nombreTicket }}»</p>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Observación</mat-label>
        <textarea
          #textoArea
          matInput
          rows="4"
          maxlength="500"
          [(ngModel)]="texto"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">
        Cancelar
      </button>
      <button mat-flat-button color="primary" type="button" (click)="guardar()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .hint {
        margin: 0 0 8px;
        font-size: 0.85rem;
        opacity: 0.7;
      }
      .w-full {
        width: 100%;
      }
    `
  ]
})
export class TicketObservacionDialogComponent implements AfterViewInit {
  @ViewChild('textoArea') textoArea?: ElementRef<HTMLTextAreaElement>;
  texto = '';

  constructor(
    public dialogRef: MatDialogRef<TicketObservacionDialogComponent, string | null>,
    @Inject(MAT_DIALOG_DATA) public data: TicketObservacionDialogData
  ) {
    this.texto = data.observaciones ?? '';
    this.dialogRef.afterOpened().subscribe(() => {
      setTimeout(() => this.enfocarCajaTexto(), 50);
    });
  }

  get esEdicion(): boolean {
    return (this.data.observaciones ?? '').trim().length > 0;
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.enfocarCajaTexto(), 0);
  }

  guardar(): void {
    this.dialogRef.close(this.texto);
  }

  private enfocarCajaTexto(): void {
    const el = this.textoArea?.nativeElement;
    if (!el) {
      return;
    }
    el.focus();
    if (this.esEdicion) {
      el.select();
    }
  }
}
