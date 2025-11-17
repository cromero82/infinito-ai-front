import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HistorialReciboService, HistorialReciboDto, HistorialReciboPage } from '../service/historial-recibo.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'vex-historial-ventas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './historial-ventas.component.html',
  styleUrls: ['./historial-ventas.component.scss']
})
export class HistorialVentasComponent implements OnInit, OnDestroy {
  selectedFilter = 'todos';
  fechaCtrl = new FormControl<Date | null>(null);
  historialRecibos: HistorialReciboDto[] = [];
  loading = false;
  loadingMore = false;
  error: string | null = null;
  page = 1;
  size = 10;
  totalElements = 0;
  totalPages = 0;
  private destroy$ = new Subject<void>();
  @ViewChild('recibosList', { static: false }) recibosListRef?: ElementRef<HTMLDivElement>;

  constructor(private historialReciboService: HistorialReciboService) {}

  ngOnInit(): void {
    this.loadHistorialRecibos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectFilter(filter: string): void {
    this.selectedFilter = filter;
    this.page = 1;
    this.historialRecibos = [];
    this.loadHistorialRecibos();
  }

  onFechaChange(): void {
    this.page = 1;
    this.historialRecibos = [];
    this.loadHistorialRecibos();
  }

  loadHistorialRecibos(): void {
    if (this.page === 1) {
      this.loading = true;
      this.historialRecibos = []; // Clear list when loading first page
    } else {
      this.loadingMore = true;
    }
    this.error = null;
    
    // Format date as YYYY-MM-DD if a date is selected
    let fechaParam: string | undefined;
    if (this.fechaCtrl.value) {
      const date = this.fechaCtrl.value;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      fechaParam = `${year}-${month}-${day}`;
    }
    
    this.historialReciboService.searchHistorialRecibos(this.page, this.size, 'fechaCreacion,desc', fechaParam).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (page: HistorialReciboPage) => {
        const newContent = page.content ?? [];
        
        if (this.page === 1) {
          // First page: replace the list
          this.historialRecibos = newContent;
        } else {
          // Subsequent pages: concatenate with existing results
          this.historialRecibos = this.historialRecibos.concat(newContent);
        }
        
        this.totalElements = page.totalElements ?? 0;
        this.totalPages = page.totalPages ?? 0;
        this.loading = false;
        this.loadingMore = false;
      },
      error: (err) => {
        console.error('Error loading historial recibos', err);
        this.error = 'Error al cargar el historial de ventas.';
        this.loading = false;
        this.loadingMore = false;
      }
    });
  }

  onRecibosListScroll(): void {
    if (!this.recibosListRef?.nativeElement) {
      return;
    }

    const element = this.recibosListRef.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Calculate remaining scrollable distance
    const remainingScroll = scrollHeight - (scrollTop + clientHeight);
    
    // Estimate item height (approximately 30-35px per item based on padding and content)
    const estimatedItemHeight = 35;
    // Calculate how many items are visible
    const visibleItems = Math.ceil(clientHeight / estimatedItemHeight);
    // Calculate how many items are remaining below the viewport
    const remainingItems = Math.ceil(remainingScroll / estimatedItemHeight);
    
    // Trigger pagination when there are only 2-3 items left visible (or 70-100px remaining)
    // This ensures we load more content before the user reaches the bottom
    const triggerThreshold = Math.max(70, estimatedItemHeight * 2.5); // At least 2.5 items worth of space
    
    const isNearBottom = remainingScroll <= triggerThreshold;

    // Only load if we're near bottom, have more pages, and not already loading
    if (isNearBottom && this.page < this.totalPages && !this.loadingMore && !this.loading) {
      const nextPage = this.page + 1;
      this.page = nextPage;
      this.loadHistorialRecibos();
    }
  }

  formatCurrency(value: number): string {
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(value).replace('COP', '$').trim();
  }

  formatCurrencyWithBold(value: number): string {
    const formatted = this.formatCurrency(value);
    // Make the numeric part bold (everything after $ and space)
    // Format: "$ 420.000" -> "$ <b>420.000</b>"
    const match = formatted.match(/^\$\s*(.+)$/);
    if (match) {
      return `$ <b>${match[1]}</b>`;
    }
    return formatted;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    }).toLowerCase();

    if (dateOnly.getTime() === today.getTime()) {
      return timeStr;
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return `Ayer, ${timeStr}`;
    } else {
      // Check if it's within the last 7 days (show day name)
      const daysDiff = Math.floor((today.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayName = daysOfWeek[date.getDay()];
        return `${dayName}, ${timeStr}`;
      } else {
        // Show date format: "14-Nov, 3:17 pm"
        const day = date.getDate();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthName = months[date.getMonth()];
        return `${day}-${monthName}, ${timeStr}`;
      }
    }
  }

  selectRecibo(recibo: HistorialReciboDto): void {
    // TODO: Handle recibo selection - show details on right side
    console.log('Selected recibo:', recibo);
  }
}

