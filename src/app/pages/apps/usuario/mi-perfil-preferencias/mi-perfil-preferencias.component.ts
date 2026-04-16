import { Component, OnInit } from '@angular/core';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { MatButtonModule } from '@angular/material/button';
import { NgIf, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ConfigurationItem, ConfigurationService } from '../../../../auth/service/configuration.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'gm-mi-perfil-preferencias',
    templateUrl: './mi-perfil-preferencias.component.html',
    styleUrls: ['./mi-perfil-preferencias.component.scss'],
    animations: [fadeInUp400ms, fadeInRight400ms, scaleIn400ms],
    imports: [
        MatIconModule,
        NgIf,
        MatButtonModule,
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatSnackBarModule
    ]
})
export class MiPerfilPreferenciasComponent implements OnInit {
  guardando = false;

  porcentajeMinimoGanancia = 10;
  porcentajeMaximoGanancia = 80;

  constructor(
    private configurationService: ConfigurationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarAlertaPrecios();
  }

  cargarAlertaPrecios(): void {
    this.configurationService.obtenerTodasConfiguraciones().subscribe({
      next: (configs: ConfigurationItem[]) => {
        const alertaPrecios = configs.find(c => c.key === 'alerta-precios');
        if (alertaPrecios?.value) {
          try {
            const parsed = JSON.parse(alertaPrecios.value) as { porcentaje_minimo?: number; porc_maximo?: number };
            this.porcentajeMinimoGanancia = parsed.porcentaje_minimo ?? 10;
            this.porcentajeMaximoGanancia = parsed.porc_maximo ?? 80;
          } catch (e) {
            console.warn('Error al parsear alerta-precios:', e);
          }
        }
      },
      error: () => {
        // Usar valores de localStorage como fallback
        const min = localStorage.getItem('alerta-precios-porcentaje-minimo');
        const max = localStorage.getItem('alerta-precios-porcentaje-maximo');
        if (min) this.porcentajeMinimoGanancia = parseFloat(min) || 10;
        if (max) this.porcentajeMaximoGanancia = parseFloat(max) || 80;
      }
    });
  }

  guardarAlertaPrecios(): void {
    const min = this.clampPorcentaje(this.porcentajeMinimoGanancia);
    const max = this.clampPorcentaje(this.porcentajeMaximoGanancia);

    if (min > max) {
      this.snackBar.open('El porcentaje mínimo no puede ser mayor al máximo', 'Cerrar', { duration: 4000 });
      return;
    }

    const value = JSON.stringify({
      porcentaje_minimo: min,
      porc_maximo: max
    });

    this.guardando = true;

    this.configurationService.actualizarPorKey('alerta-precios', value)
      .pipe(
        finalize(() => {
          this.guardando = false;
        })
      )
      .subscribe({
        next: () => {
          localStorage.setItem('alerta-precios-porcentaje-minimo', String(min));
          localStorage.setItem('alerta-precios-porcentaje-maximo', String(max));
          this.snackBar.open('Configuración guardada correctamente', 'Cerrar', { duration: 3000 });
        },
        error: (err: unknown) => {
          const errorResponse = err as { error?: { message?: string }; message?: string };
          const msg = errorResponse.error?.message || errorResponse.message || 'Error al guardar la configuración';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
        }
      });
  }

  private clampPorcentaje(val: number): number {
    return Math.max(0, Math.min(100, Number(val) || 0));
  }
}
