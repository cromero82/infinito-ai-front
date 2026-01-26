import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface FooterItemDto {
  textoClave: string;
  valorClave: string;
  estiloCssClave: string;
}

@Component({
  selector: 'vex-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule]
})
export class FooterComponent implements OnInit, OnDestroy {
  @Input() footerItems: FooterItemDto[] = [];

  constructor() {}

  trackByTextoClave(_index: number, item: FooterItemDto): string {
    return item.textoClave;
  }

  ngOnInit() {}

  ngOnDestroy(): void {}
}
