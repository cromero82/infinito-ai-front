import { Component, OnInit } from '@angular/core';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../pages/auth/service/auth.service';

@Component({
  selector: 'vex-social-profile',
  templateUrl: './social-profile.component.html',
  styleUrls: ['./social-profile.component.scss'],
  animations: [fadeInUp400ms, fadeInRight400ms, scaleIn400ms],
  standalone: true,
  imports: [MatIconModule, NgFor, NgIf, MatButtonModule, CommonModule]
})
export class SocialProfileComponent implements OnInit {
  nombreUsuario: string | null = null;
  correoUsuario: string | null = null;
  telefonoUsuario: string | null = null;
  rolNombre: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario(): void {
    this.nombreUsuario = this.authService.getNombre();
    this.rolNombre = this.authService.getRolNombre();
    
    // Obtener correo del token decodificado
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = this.decodeJwt(token);
        this.correoUsuario = payload.sub || null;
        this.telefonoUsuario = payload.telefono || null;
      } catch (error) {
        console.error('Error al decodificar token:', error);
      }
    }
  }

  private decodeJwt(token: string): any {
    try {
      const parts = token.trim().split('.');
      if (parts.length !== 3) {
        throw new Error('Token JWT inválido');
      }

      const payloadEncoded = parts[1];
      let base64 = payloadEncoded.replace(/-/g, '+').replace(/_/g, '/');
      
      const paddingLength = (4 - base64.length % 4) % 4;
      const padded = base64 + '='.repeat(paddingLength);
      
      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error al decodificar JWT:', error);
      throw error;
    }
  }
}
