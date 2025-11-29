import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VexBreadcrumbsComponent } from '@vex/components/vex-breadcrumbs/vex-breadcrumbs.component';
import { VexSecondaryToolbarComponent } from '@vex/components/vex-secondary-toolbar/vex-secondary-toolbar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HistorialVentasDashboardComponent } from '../historial-ventas-dashboard/historial-ventas-dashboard.component';

@Component({
  selector: 'vex-ventas-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    VexSecondaryToolbarComponent,
    VexBreadcrumbsComponent,
    MatButtonModule,
    MatIconModule,
    HistorialVentasDashboardComponent
  ],
  templateUrl: './ventas-dashboard.component.html',
  styleUrls: ['./ventas-dashboard.component.scss']
})
export class VentasDashboardComponent {
  constructor() {}
}

