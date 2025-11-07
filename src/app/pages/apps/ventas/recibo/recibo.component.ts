import { Component, Input } from '@angular/core';

@Component({
  selector: 'vex-recibo',
  standalone: true,
  templateUrl: './recibo.component.html',
  styleUrls: ['./recibo.component.scss']
})
export class ReciboComponent {
  @Input() ticket: any;
}


