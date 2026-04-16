import { Component } from '@angular/core';
import { ListaProductosComponent } from '../lista-productos/lista-productos.component';

@Component({
    selector: 'vex-admin-productos',
    imports: [ListaProductosComponent],
    templateUrl: './admin-productos.component.html',
    styleUrl: './admin-productos.component.scss'
})
export class AdminProductosComponent {}
