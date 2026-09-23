import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface RestaurarTicketDialogResult {
  motivoTexto: string;
}

@Component({
  selector: 'vex-restaurar-ticket-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>Restaurar ticket</h2>
    <mat-dialog-content>
      <p class="text-secondary mb-4">
        Se generará una nota crédito interna y el ticket volverá a edición para
        corregir el pago erróneo.
      </p>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Motivo (obligatorio)</mat-label>
        <textarea
          matInput
          rows="3"
          [(ngModel)]="motivoTexto"
          placeholder="Ej: Cliente pagó producto equivocado"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancelar()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="!motivoValido"
        (click)="confirmar()">
        Restaurar
      </button>
    </mat-dialog-actions>
  `
})
export class RestaurarTicketDialogComponent {
  motivoTexto = '';

  constructor(
    private dialogRef: MatDialogRef<
      RestaurarTicketDialogComponent,
      RestaurarTicketDialogResult | undefined
    >
  ) {}

  get motivoValido(): boolean {
    return this.motivoTexto.trim().length >= 10;
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  confirmar(): void {
    if (!this.motivoValido) {
      return;
    }
    this.dialogRef.close({ motivoTexto: this.motivoTexto.trim() });
  }
}
