import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Tipo } from '../../interfaces/tipo.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgFor, NgClass } from '@angular/common';
import { TiposService } from '../../service/tipos-service';

@Component({
    selector: 'vex-tipos-table-menu',
    templateUrl: './tipos-table-menu.component.html',
    styleUrls: ['./tipos-table-menu.component.scss'],
    imports: [MatButtonModule, MatIconModule, NgFor, NgClass]
})
export class TiposTableMenuComponent implements OnInit {
  @Output() filterChange = new EventEmitter<Tipo[]>();
  @Output() openAddNew = new EventEmitter<void>();

  categories = [
    {
      value: 'all',
      label: 'Todos los Tipos',
      count: 0
    },
    {
      value: 'electronics',
      label: 'Electrónicos',
      count: 0
    },
    {
      value: 'clothing',
      label: 'Ropa',
      count: 0
    },
    {
      value: 'food',
      label: 'Alimentos',
      count: 0
    },
    {
      value: 'home',
      label: 'Hogar',
      count: 0
    }
  ];

  activeCategory = 'all';
  allTipos: Tipo[] = [];

  constructor(private tiposService: TiposService) {}

  ngOnInit() {
    this.loadTipos();
  }

  loadTipos() {
    this.tiposService.getTipos().subscribe({
      next: (tipos) => {
        this.allTipos = tipos;
        this.updateCategoryCounts();
        this.setFilter('all');
      },
      error: (error) => {
        console.error('Error loading tipos:', error);
        this.allTipos = [];
        this.updateCategoryCounts();
        this.setFilter('all');
      }
    });
  }

  updateCategoryCounts() {
    this.categories[0].count = this.allTipos.length; // All
    this.categories[1].count = this.allTipos.filter((t: Tipo) => 
      t.name.toLowerCase().includes('electrónicos')).length;
    this.categories[2].count = this.allTipos.filter((t: Tipo) => 
      t.name.toLowerCase().includes('ropa')).length;
    this.categories[3].count = this.allTipos.filter((t: Tipo) => 
      t.name.toLowerCase().includes('alimentos')).length;
    this.categories[4].count = this.allTipos.filter((t: Tipo) => 
      t.name.toLowerCase().includes('hogar')).length;
  }

  setFilter(category: string) {
    this.activeCategory = category;

    let filteredData: Tipo[];

    switch (category) {
      case 'electronics':
        filteredData = this.allTipos.filter((t: Tipo) => t.name.toLowerCase().includes('electrónicos'));
        break;
      case 'clothing':
        filteredData = this.allTipos.filter((t: Tipo) => t.name.toLowerCase().includes('ropa'));
        break;
      case 'food':
        filteredData = this.allTipos.filter((t: Tipo) => t.name.toLowerCase().includes('alimentos'));
        break;
      case 'home':
        filteredData = this.allTipos.filter((t: Tipo) => t.name.toLowerCase().includes('hogar'));
        break;
      default:
        filteredData = this.allTipos;
    }

    this.filterChange.emit(filteredData);
  }

  addNew() {
    this.openAddNew.emit();
  }
} 