import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClienteDto } from '../service/cliente.service';
import { TicketsService, TicketDto } from '../service/tickets.service';
import { ClienteSelectorComponent } from '../cliente-selector/cliente-selector.component';

export interface EditarTabTicketData {
  ticket: TicketDto;
}

@Component({
    selector: 'editar-tab-ticket',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        ClienteSelectorComponent
    ],
    templateUrl: './editar-tab-ticket.component.html',
    styleUrls: ['./editar-tab-ticket.component.scss']
})
export class EditarTabTicketComponent {
  selectedClienteId: number | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<EditarTabTicketComponent>,
    private ticketsService: TicketsService,
    @Inject(MAT_DIALOG_DATA) public data: EditarTabTicketData
  ) {
    // Inicializar con el cliente actual del ticket (si lo tiene)
    this.selectedClienteId = data.ticket.cliente?.id ?? null;
  }

  onClienteSelectedFromSelector(cliente: ClienteDto | null): void {
    this.selectedClienteId = cliente?.id ?? null;
  }

  canGuardar(): boolean {
    return this.selectedClienteId !== null && !this.loading;
  }

  guardar(): void {
    if (!this.canGuardar()) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.ticketsService.actualizaCliente(this.data.ticket.id, this.selectedClienteId!).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error actualizando cliente del ticket', err);
        this.error = 'No se pudo actualizar el cliente del ticket.';
        this.loading = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
