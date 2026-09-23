import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  EstablecimientoDto,
  EstablecimientoService
} from '../service/establecimiento.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'vex-configuracion-establecimiento',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule
  ],
  templateUrl: './configuracion-establecimiento.component.html',
  styleUrl: './configuracion-establecimiento.component.scss'
})
export class ConfiguracionEstablecimientoComponent implements OnInit {
  loading = true;
  guardando = false;
  form: EstablecimientoDto = {
    id: 0,
    razonSocial: '',
    regimenTributario: 'NO_RESPONSABLE_IVA',
    regimenLeyendaImpresion:
      'Persona natural no responsable de IVA — Comprobante POS interno'
  };

  constructor(
    private establecimientoService: EstablecimientoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.establecimientoService.loadActual(true).subscribe({
      next: (est) => {
        this.form = { ...est };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('No se pudo cargar el establecimiento', 'Cerrar', {
          duration: 4000
        });
      }
    });
  }

  guardar(): void {
    if (!this.form.razonSocial?.trim()) {
      this.snackBar.open('La razón social es obligatoria', 'Cerrar', {
        duration: 4000
      });
      return;
    }

    this.guardando = true;
    this.establecimientoService
      .update(this.form.id, this.form)
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: (actualizado) => {
          this.form = { ...actualizado };
          this.snackBar.open('Datos del negocio actualizados', undefined, {
            duration: 3000,
            horizontalPosition: 'right'
          });
        },
        error: () => {
          this.snackBar.open('Error al guardar. ¿Tienes rol admin?', 'Cerrar', {
            duration: 5000
          });
        }
      });
  }
}
