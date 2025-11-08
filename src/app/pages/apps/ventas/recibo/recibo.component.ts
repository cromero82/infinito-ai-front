import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReciboService, ReciboDto } from '../service/recibo.service';

@Component({
  selector: 'vex-recibo',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './recibo.component.html',
  styleUrls: ['./recibo.component.scss']
})
export class ReciboComponent implements OnChanges {
  @Input() ticket: any;
  @Input() reciboId: number | null = null;
  recibo: ReciboDto | null = null;
  loading = false;
  error: string | null = null;

  constructor(private reciboService: ReciboService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('reciboId' in changes) {
      const change = changes['reciboId'];
      const value = change.currentValue as number | null;
      const previous = change.previousValue as number | null;
      if (value === previous) {
        return;
      }
      if (value === null || value === undefined) {
        this.recibo = null;
        this.error = null;
        this.loading = false;
      } else {
        this.fetchRecibo(value);
      }
    }
  }

  private fetchRecibo(id: number): void {
    this.loading = true;
    this.error = null;
    this.reciboService.getRecibo(id).subscribe({
      next: (resp) => {
        this.recibo = resp;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading recibo', err);
        this.recibo = null;
        this.error = 'No se pudo cargar el recibo.';
        this.loading = false;
      }
    });
  }
}


