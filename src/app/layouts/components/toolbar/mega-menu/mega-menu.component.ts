import { Component, OnInit } from '@angular/core';
import { VexPopoverRef } from '@vex/components/vex-popover/vex-popover-ref';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { NgFor } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export interface MegaMenuFeature {
  icon: string;
  label: string;
  route: string;
}

export interface MegaMenuPage {
  label: string;
  route: string;
}

@Component({
  selector: 'vex-mega-menu',
  templateUrl: './mega-menu.component.html',
  standalone: true,
  imports: [MatButtonModule, NgFor, RouterLink, MatIconModule]
})
export class MegaMenuComponent implements OnInit {
  features: MegaMenuFeature[] = [
    {
      icon: 'mat:assignment',
      label: 'Tickets',
      route: '/apps/tickets'
    },
    {
      icon: 'mat:shopping_cart',
      label: 'Productos',
      route: '/apps/productos/admin-productos'
    },
    {
      icon: 'mat:history',
      label: 'Historial',
      route: '/apps/tickets/historial'
    },
    {
      icon: 'mat:dashboard',
      label: 'Financiero',
      route: '/apps/financiero'
    },
    {
      icon: 'mat:people',
      label: 'Clientes',
      route: '/apps/clientes/list'
    },
    {
      icon: 'mat:manage_accounts',
      label: 'Usuarios',
      route: '/apps/gestion-usuarios'
    }
  ];

  pages: MegaMenuPage[] = [
    {
      label: 'Punto de venta',
      route: '/apps/tickets'
    },
    {
      label: 'Iniciar sesión',
      route: '/login'
    },
    {
      label: 'Productos',
      route: '/apps/productos/admin-productos'
    },
    {
      label: 'Historial de ventas',
      route: '/apps/tickets/historial'
    },
    {
      label: 'Financiero',
      route: '/apps/financiero'
    },
    {
      label: 'Clientes',
      route: '/apps/clientes/list'
    },
    {
      label: 'Gestión de usuarios',
      route: '/apps/gestion-usuarios'
    },
    {
      label: 'Tipos',
      route: '/apps/tipos'
    },
    {
      label: 'Carga de productos',
      route: '/apps/cargue-productos'
    }
  ];

  constructor(private popoverRef: VexPopoverRef<MegaMenuComponent>) {}

  ngOnInit() {}

  close() {
    this.popoverRef.close();
  }
}
