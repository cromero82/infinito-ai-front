import { Component } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Editor, Toolbar } from 'ngx-editor';
import { DataService, pageSelection, apiResultFormat, routes, SidebarService } from 'src/app/core/core.index';
import { salesList } from 'src/app/shared/model/page.model';
import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';
interface data {
  value: string;
}
@Component({
  selector: 'app-pos-order',
  standalone: false,
  
  templateUrl: './pos-order.component.html',
  styleUrl: './pos-order.component.scss'
})
export class PosOrderComponent {
  initChecked = false;
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
  public selectedValue11 = '';
  public selectedValue12 = '';
  public routes = routes;
  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic', 'format_clear'],
    ['underline', 'strike'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['image'],
    ['link'],
  ];
  selectedList1: data[] = [
    { value: 'Sort by Date' },
    { value: '07 09 23' },
    { value: '21 09 23' },
  ];
  selectedList2: data[] = [
    { value: 'Choose Customer Name' },
    { value: 'Macbook pro' },
    { value: 'Orange' },
  ];
  selectedList3: data[] = [
    { value: 'Choose Status' },
    { value: 'Computers' },
    { value: 'Fruits' },
  ];
  selectedList4: data[] = [
    { value: 'Choose Payment Status' },
    { value: 'Computers' },
    { value: 'Fruits' },
  ];
  selectedList5: data[] = [{ value: 'Choose' }, { value: 'Customer Name' }];
  selectedList6: data[] = [{ value: 'Choose' }, { value: 'Supplier Name' }];
  selectedList7: data[] = [
    { value: 'Choose' },
    { value: 'Completed' },
    { value: 'Inprogress' },
  ];
  selectedList8: data[] = [{ value: 'Thomas' }, { value: 'Name' }];
  selectedList9: data[] = [
    { value: 'Dazzle Shoes' },
    { value: 'Supplier Name' },
  ];
  selectedList10: data[] = [
    { value: 'Choose' },
    { value: 'Completed' },
    { value: 'Inprogress' },
  ];
  selectedList11: data[] = [
    { value: 'Choose' },
    { value: 'Online' },
    { value: 'Cash' },
  ];
  selectedList12: data[] = [
    { value: 'Cash' },
    { value: 'Online' },
    { value: 'Inprogress' },
  ];

  // pagination variables
  public tableData: Array<salesList> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<salesList>;
  public searchDataValue = '';
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
        if (this.router.url == this.routes.PosOrder) {
          this.getTableData({ skip: res.skip, limit: this.totalData  });
          this.pageSize = res.pageSize;
        }
      });
    });
  }

  private getTableData(pageOption: pageSelection): void {
    this.data.getSalesList().subscribe((apiRes: apiResultFormat) => {
      this.tableData = [];
      this.serialNumberArray = [];
      this.totalData = apiRes.totalData;
      apiRes.data.map((res: salesList, index: number) => {
        const serialNumber = index + 1;
        if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
          res.sNo = serialNumber;
          this.tableData.push(res);
          this.serialNumberArray.push(serialNumber);
        }
      });
      this.dataSource = new MatTableDataSource<salesList>(this.tableData);
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
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  public filter = false;
  openFilter() {
    this.filter = !this.filter;
  }
  public cartValue = [2,2,2,2,2,2,2,2];

  public addPos(i: number): void {
    this.cartValue[i]++;
  }
  public reducePos(i: number): void {
    this.cartValue[i]--;
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
