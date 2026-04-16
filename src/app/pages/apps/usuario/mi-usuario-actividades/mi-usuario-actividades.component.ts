import { Component, OnInit } from '@angular/core';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { SesionesService, SesionDto } from '../../ventas/service/sesiones.service';

@Component({
    selector: 'gm-mi-usuario-actividades',
    templateUrl: './mi-usuario-actividades.component.html',
    styleUrls: ['./mi-usuario-actividades.component.scss'],
    animations: [fadeInUp400ms, fadeInRight400ms, scaleIn400ms],
    imports: [MatIconModule, NgFor, NgIf, MatButtonModule, MatTableModule, CommonModule]
})
export class MiUsuarioActividadesComponent implements OnInit {
  displayedColumns: string[] = ['tipoActividad', 'fechaInicio', 'fechaFin'];
  sesiones: SesionDto[] = [];
  loading = false;
  
  constructor(
    private sesionesService: SesionesService
  ) {}

  ngOnInit(): void {
    this.cargarSesiones();
  }

  cargarSesiones(): void {
    this.loading = true;
    this.sesionesService.getTodasLasSesionesUsuario().subscribe({
      next: (sesiones) => {
        this.sesiones = sesiones;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar sesiones:', error);
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) {
      return '-';
    }
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

}

