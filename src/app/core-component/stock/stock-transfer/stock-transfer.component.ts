import { Component } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { DataService, SidebarService, apiResultFormat, pageSelection, routes } from 'src/app/core/core.index';
import { stock } from 'src/app/shared/model/page.model';
import { Editor, Toolbar } from 'ngx-editor';


import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';

import Swal from 'sweetalert2';
interface data {
  value: string;
}

@Component({
    selector: 'app-stock-transfer',
    templateUrl: './stock-transfer.component.html',
    styleUrl: './stock-transfer.component.scss',
    standalone: false
})
export class StockTransferComponent {
  initChecked = false;
 
  public routes = routes;
  public cartValue = [4,4];

  public addPos(i: number): void {
    this.cartValue[i]++;
  }
  public reducePos(i: number): void {
    this.cartValue[i]--;
  }
  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic', 'format_clear'],
    ['underline', 'strike'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['image'],
    ['link'],
  ];
  // pagination variables
  public tableData: stock[] = [];
  public tableDataCopy: stock[] = [];
  public actualData: stock[] = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<stock>;
  public searchDataValue = '';
  public skip = 0;
  public limit: number = this.pageSize;
  //** / pagination variables

  constructor(
    private data: DataService,
    private pagination: PaginationService,
    private router: Router,
    private sidebar: SidebarService
  ) {
    this.data.getDataTable().subscribe((apiRes: apiResultFormat) => {
      this.totalData = apiRes.totalData;
      this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
        if (this.router.url == this.routes.stockTransfer) {
          this.getTableData({ skip: res.skip, limit: this.totalData  });
          this.pageSize = res.pageSize;
        }
      });
    });
  }

  private getTableData(pageOption: pageSelection): void {
    this.data.getStocks().subscribe((apiRes: apiResultFormat) => {
      this.tableData = [];
      this.serialNumberArray = [];
      this.totalData = apiRes.totalData;
      apiRes.data.map((res: stock, index: number) => {
        const serialNumber = index + 1;
        if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
          res.sNo = serialNumber;
          this.tableData.push(res);
          this.serialNumberArray.push(serialNumber);
        }
      });
      this.dataSource = new MatTableDataSource<stock>(this.tableData);
      this.pagination.calculatePageSize.next({
        totalData: this.totalData,
        pageSize: this.pageSize,
        tableData: this.tableData,
        serialNumberArray: this.serialNumberArray,
      });
    });
  }

  public sortData(sort: Sort) {
    const data = this.tableData.slice();
    if (!sort.active || sort.direction === '') {
      this.tableData = data;
    } else {
      this.tableData = data.sort((a, b) => {
        const aValue = (a as never)[sort.active];
        const bValue = (b as never)[sort.active];
        return (aValue < bValue ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
      });
    }
  }

  public searchData(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    this.tableData = this.dataSource.filteredData;
  }
  public filter = false;
  openFilter() {
    this.filter = !this.filter;
  }
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  public selectedValue1 = '';
  public selectedValue2 = '';
  public selectedValue3 = '';
  public selectedValue4 = '';
  public selectedValue5 = '';
  public selectedValue6 = '';
  public selectedValue7 = '';
  public selectedValue8 = '';
  public selectedValue9 = '';
  public selectedValue10 = '';



  selectedList1: data[] = [
    { value: 'Sort by Date' },
    { value: 'Newest' },
    { value: 'Oldest' },
  ];
  selectedList2: data[] = [
    { value: 'Warehouse From' },
    { value: 'Lobar Handy' },
    { value: 'Quaint Warehouse' },
    { value: 'Traditional Warehouse' },
    { value: 'Cool Warehouse' },
  ];
  selectedList3: data[] = [
    { value: 'Warehouse To' },
    { value: 'Selosy' },
    { value: 'Logerro' },
    { value: 'Vesloo' },
    { value: 'Crompy' },
  ];
  selectedList4: data[] = [
    { value: 'Choose' },
    { value: 'Lobar Handy' },
    { value: 'Quaint Warehouse' },
   
  ];
  selectedList5: data[] = [
    { value: 'Choose' },
    { value: 'Selosy' },
    { value: 'Logerro' },
   
  ];
  selectedList6: data[] = [
    { value: 'Lobar Handy' },
    { value: 'Quaint Warehouse' },
  ];
  selectedList7: data[] = [
    { value: 'Lobar Handy' },
    { value: 'Quaint Warehouse' },
  ];
  selectedList8: data[] = [
    { value: 'Selosy' },
    { value: 'Logerro' },
  ];
  selectedList9: data[] = [
    { value: 'Choose' },
    { value: 'Lavish Warehouse' },
    { value: 'Lobar Handy' },
    { value: 'Quaint Warehouse' },
  ];
  selectedList11: data[] = [
    { value: 'Choose' },
    { value: 'North Zone Warehouse' },
    { value: 'Nova Storage Hub' },
    { value: 'Cool Warehouse' },
  ];
  selectedList10: data[] = [
    { value: 'Choose' },
    { value: 'Sent' },
    { value: 'Pending' },
  ];
  quantity: number = 2; // Initial quantity value

decreaseQuantity() {
  if (this.quantity > 1) {
    this.quantity--;
  }
}

increaseQuantity() {
  this.quantity++;
}
showBox = false;
toggleBox() {
  this.showBox = !this.showBox;
}
selectAll(initChecked: boolean) {
  if (!initChecked) {
    this.tableData.forEach((f) => {
      f.isSelected = true;
    });
  } else {
    this.tableData.forEach((f) => {
      f.isSelected = false;
    });
  }
}
ngOnInit(): void {
  this.editor = new Editor();
}
ngOnDestroy(): void {
  this.editor.destroy();
}
}
