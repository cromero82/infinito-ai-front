import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Link } from '@vex/interfaces/link.interface';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../pages/auth/service/auth.service';

export interface FriendSuggestion {
  name: string;
  imageSrc: string;
  friends: number;
  added: boolean;
}

@Component({
  selector: 'gm-usuario',
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.scss'],
  animations: [scaleIn400ms, fadeInRight400ms],
  standalone: true,
  imports: [MatTabsModule, NgFor, NgIf, RouterLinkActive, RouterLink, RouterOutlet]
})
export class UsuarioComponent implements OnInit {
  links: Link[] = [
    {
      label: 'Información Personal',
      route: './',
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'Actividad',
      route: './actividad'
    }
  ];

  nombreUsuario: string = 'Usuario';

  constructor(
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const nombre = this.authService.getNombre();
    if (nombre) {
      this.nombreUsuario = nombre;
      this.cd.markForCheck();
    }
  }
}

