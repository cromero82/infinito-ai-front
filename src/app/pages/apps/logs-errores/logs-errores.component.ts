import { Component } from '@angular/core';
import { Link } from '@vex/interfaces/link.interface';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'gm-logs-errores',
  templateUrl: './logs-errores.component.html',
  styleUrl: './logs-errores.component.scss',
  animations: [scaleIn400ms, fadeInRight400ms],
  imports: [MatTabsModule, RouterLinkActive, RouterLink, RouterOutlet]
})
export class LogsErroresComponent {
  tituloSeccion = 'Logs y errores';

  links: Link[] = [
    {
      label: 'Logs servidor',
      route: './logs-servidor'
    },
    {
      label: 'Logs aplicaciones',
      route: './logs-aplicaciones'
    }
  ];
}
