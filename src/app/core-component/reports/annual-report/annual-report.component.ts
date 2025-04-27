import { Component, ViewChild } from '@angular/core';
import { BsDatepickerConfig, BsDatepickerDirective } from 'ngx-bootstrap/datepicker';
import { SidebarService } from 'src/app/core/core.index';

@Component({
  selector: 'app-annual-report',
  standalone:false,
  templateUrl: './annual-report.component.html',
  styleUrl: './annual-report.component.scss'
})
export class AnnualReportComponent {
  isCollapsed: boolean = false;
  @ViewChild(BsDatepickerDirective, { static: false })
  datepicker?: BsDatepickerDirective;
  bsConfig: Partial<BsDatepickerConfig>;
  selectedYear: Date | undefined;
  constructor(private sidebar:SidebarService){
    this.selectedYear = new Date(new Date().getFullYear(), 0, 1);
    this.bsConfig = {
      minMode: 'year',
      dateInputFormat: 'YYYY', // Display only the year in the input
    };
  }
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
