import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Link } from '@vex/interfaces/link.interface';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'gm-gestion-usuarios',
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.scss'],
  animations: [scaleIn400ms, fadeInRight400ms],
  standalone: true,
  imports: [MatTabsModule, NgFor, NgIf, RouterLinkActive, RouterLink, RouterOutlet]
})
export class GestionUsuariosComponent implements OnInit {
  links: Link[] = [
    {
      label: 'Monitoreo',
      route: './',
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'Roles',
      route: './roles'
    }
  ];

  constructor(
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Inicialización del componente
  }
}





