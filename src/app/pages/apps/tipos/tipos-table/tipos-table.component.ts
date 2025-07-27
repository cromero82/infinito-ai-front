import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import { Tipo } from '../interfaces/tipo.interface';
import { TiposEditComponent } from '../components/tipos-edit/tipos-edit.component';
import { TiposDataTableComponent } from './tipos-data-table/tipos-data-table.component';
import { TiposTableMenuComponent } from './tipos-table-menu/tipos-table-menu.component';
import { TiposService } from '../service/tipos-service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { stagger40ms } from '@vex/animations/stagger.animation';

@Component({
  selector: 'vex-tipos-table',
  templateUrl: './tipos-table.component.html',
  styleUrls: ['./tipos-table.component.scss'],
  animations: [stagger40ms, scaleIn400ms, fadeInRight400ms],
  styles: [
    `
      .mat-drawer-container {
        background: transparent !important;
      }
    `
  ],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSidenavModule,
    TiposTableMenuComponent,
    TiposDataTableComponent,
    AsyncPipe
  ]
})
export class TiposTableComponent implements OnInit {
  searchCtrl = new FormControl();
  searchStr$ = this.searchCtrl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged()
  );
  menuOpen = false;
  activeCategory = 'all';
  tableData: Tipo[] = [];
  tableColumns: TableColumn<Tipo>[] = [
    { label: 'ID', property: 'id', type: 'text', cssClasses: ['font-medium'] },
    { label: 'NOMBRE', property: 'name', type: 'text', cssClasses: ['font-medium'] },
    { label: 'PORCENTAJE DE GANANCIA', property: 'percentProfit', type: 'text', cssClasses: ['text-secondary'] },
    { label: '', property: 'menu', type: 'button', cssClasses: ['text-secondary', 'w-10'] }
  ];

  constructor(
    private dialog: MatDialog,
    private tiposService: TiposService
  ) {}

  ngOnInit() {
    this.loadTipos();
  }

  loadTipos() {
    this.tiposService.getTipos().subscribe({
      next: (tipos) => {
        this.tableData = tipos;
      },
      error: (error) => {
        console.error('Error loading tipos:', error);
        // Fallback to empty array if API fails
        this.tableData = [];
      }
    });
  }

  openTipo(id?: Tipo['id']) {
    this.dialog.open(TiposEditComponent, {
      data: id || null,
      width: '600px'
    }).afterClosed().subscribe(result => {
      if (result) {
        // Reload data after successful edit/create
        this.loadTipos();
      }
    });
  }

  setData(data: Tipo[]) {
    this.tableData = data;
    this.menuOpen = false;
  }

  openMenu() {
    this.menuOpen = true;
  }
} 