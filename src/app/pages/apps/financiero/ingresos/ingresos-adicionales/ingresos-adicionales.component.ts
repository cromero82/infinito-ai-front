import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'vex-ingresos-adicionales',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './ingresos-adicionales.component.html',
  styleUrl: './ingresos-adicionales.component.scss'
})
export class IngresosAdicionalesComponent {}
