import { Component } from '@angular/core';
import { Link } from '@vex/interfaces/link.interface';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'gm-gastos',
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.scss',
  animations: [scaleIn400ms, fadeInRight400ms],
  standalone: true,
  imports: [MatTabsModule, NgFor, NgIf, RouterLinkActive, RouterLink, RouterOutlet]
})
export class GastosComponent {
  tituloSeccion = 'Gastos';

  links: Link[] = [
    {
      label: 'Egresos',
      route: './',
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'Proveedores',
      route: './proveedores'
    },
    {
      label: 'Resumen económico',
      route: './resumen-economico'
    }
  ];
}
