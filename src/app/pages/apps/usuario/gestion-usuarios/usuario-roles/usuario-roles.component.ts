import { Component, OnInit } from '@angular/core';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'gm-usuario-roles',
  templateUrl: './usuario-roles.component.html',
  styleUrls: ['./usuario-roles.component.scss'],
  animations: [fadeInUp400ms, fadeInRight400ms, scaleIn400ms],
  standalone: true,
  imports: [MatIconModule, NgFor, NgIf, MatButtonModule, CommonModule]
})
export class UsuarioRolesComponent implements OnInit {

  constructor() {}

  ngOnInit(): void {
    // Inicialización del componente
  }
}



