import { Component, Inject } from '@angular/core';

import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ClienteDto } from '../service/cliente.service';
import { TicketsService, TicketDto } from '../service/tickets.service';
import { ClienteSelectorComponent } from '../cliente-selector/cliente-selector.component';

/** Cliente anónimo / genérico: puede repetirse en varios tickets. */
const CLIENTE_ANONIMO_ID = 1;

export interface EditarTabTicketData {
  ticket: TicketDto;
  /** Tickets de la sesión actual (para detectar cliente ya asignado). */
  ticketsSesion: TicketDto[];
  /** True si el ticket en edición tiene al menos un producto. */
  tieneProductos: boolean;
}

export type EditarTabTicketResult =
  | { type: 'updated' }
  | { type: 'move-products'; targetTicketId: number }
  | false;

@Component({
  selector: 'editar-tab-ticket',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    ClienteSelectorComponent
  ],
  templateUrl: './editar-tab-ticket.component.html',
  styleUrls: ['./editar-tab-ticket.component.scss']
})
export class EditarTabTicketComponent {
  selectedClienteId: number | null = null;
  selectedClienteNombre: string | null = null;
  loading = false;
  error: string | null = null;

  /** Paso de conflicto: cliente ya tiene otro ticket. */
  mostrandoConflicto = false;
  ticketExistente: TicketDto | null = null;
  moverProductosChecked = true;

  constructor(
    private dialogRef: MatDialogRef<
      EditarTabTicketComponent,
      EditarTabTicketResult
    >,
    private ticketsService: TicketsService,
    @Inject(MAT_DIALOG_DATA) public data: EditarTabTicketData
  ) {
    this.selectedClienteId = data.ticket.cliente?.id ?? null;
    this.selectedClienteNombre = data.ticket.cliente?.nombre ?? null;
  }

  get etiquetaTicketExistente(): string {
    const c = this.ticketExistente?.cliente?.nombre?.trim();
    return c || this.ticketExistente?.nombre || 'ticket existente';
  }

  get textoBotonAceptar(): string {
    if (!this.mostrandoConflicto) {
      return 'Guardar';
    }
    return this.data.tieneProductos
      ? 'Aceptar y mover productos'
      : 'Aceptar';
  }

  onClienteSelectedFromSelector(cliente: ClienteDto | null): void {
    this.selectedClienteId = cliente?.id ?? null;
    this.selectedClienteNombre = cliente?.nombre ?? null;
    this.error = null;
    this.mostrandoConflicto = false;
    this.ticketExistente = null;
    this.moverProductosChecked = true;
  }

  canGuardar(): boolean {
    if (this.loading) {
      return false;
    }
    if (this.mostrandoConflicto) {
      if (this.data.tieneProductos) {
        return this.moverProductosChecked;
      }
      return true;
    }
    return this.selectedClienteId !== null;
  }

  guardar(): void {
    if (!this.canGuardar()) {
      return;
    }

    if (this.mostrandoConflicto) {
      this.aceptarConflicto();
      return;
    }

    if (this.selectedClienteId == null) {
      return;
    }

    // Mismo cliente ya en este ticket: cerrar sin PUT.
    if (this.data.ticket.cliente?.id === this.selectedClienteId) {
      this.dialogRef.close(false);
      return;
    }

    const conflicto = this.buscarTicketConCliente(this.selectedClienteId);
    if (conflicto) {
      this.ticketExistente = conflicto;
      this.mostrandoConflicto = true;
      this.error = null;
      return;
    }

    this.persistirCliente();
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  private aceptarConflicto(): void {
    if (!this.ticketExistente) {
      return;
    }
    if (this.data.tieneProductos) {
      if (!this.moverProductosChecked) {
        return;
      }
      this.dialogRef.close({
        type: 'move-products',
        targetTicketId: this.ticketExistente.id
      });
      return;
    }
    // Sin productos: solo reconocer el conflicto; no asignar cliente.
    this.dialogRef.close(false);
  }

  private buscarTicketConCliente(clienteId: number): TicketDto | null {
    if (clienteId === CLIENTE_ANONIMO_ID) {
      return null;
    }
    const otros = this.data.ticketsSesion ?? [];
    return (
      otros.find(
        (t) =>
          t.id !== this.data.ticket.id &&
          t.cliente?.id === clienteId &&
          t.cliente.id !== CLIENTE_ANONIMO_ID
      ) ?? null
    );
  }

  private persistirCliente(): void {
    this.loading = true;
    this.error = null;

    this.ticketsService
      .actualizaCliente(this.data.ticket.id, this.selectedClienteId!)
      .subscribe({
        next: () => {
          this.dialogRef.close({ type: 'updated' });
        },
        error: (err) => {
          console.error('Error actualizando cliente del ticket', err);
          const msg =
            err?.error?.message ||
            err?.error?.mensaje ||
            'No se pudo actualizar el cliente del ticket.';
          this.error = msg;
          this.loading = false;
        }
      });
  }
}
