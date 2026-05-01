import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FooterItemsFlow } from '../../services/footer.service';

export interface FooterItemDto {
  textoClave: string;
  valorClave: string;
  estiloCssClave: string;
}

@Component({
    selector: 'vex-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    imports: [CommonModule, MatButtonModule, MatIconModule]
})
export class FooterComponent implements OnInit, OnDestroy {
  @Input() footerItems: FooterItemDto[] = [];
  /** `ltr` (defecto): ítems al inicio del pie; `rtl`: grupo al borde derecho y orden visual de derecha a izquierda (pasar ítems [principal, secundario] para que el secundario quede a la izquierda). */
  @Input() itemsFlow: FooterItemsFlow = 'ltr';

  constructor() {}

  trackByTextoClave(_index: number, item: FooterItemDto): string {
    return item.textoClave;
  }

  ngOnInit() {}

  ngOnDestroy(): void {}
}
