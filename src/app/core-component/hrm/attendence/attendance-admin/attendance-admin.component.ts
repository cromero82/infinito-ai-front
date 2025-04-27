import { Component, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import {
  SidebarService,
  apiResultFormat,
  routes,
} from 'src/app/core/core.index';
import { DataService } from 'src/app/core/service/data/data.service';
import { attendenceAdmin } from 'src/app/shared/model/page.model';
import {
  PaginationService,
  pageSelection,
  tablePageSize,
} from 'src/app/shared/shared.index';
import { DatePipe } from '@angular/common';
interface data {
  value: string;
}

@Component({
    selector: 'app-attendance-admin',
    templateUrl: './attendance-admin.component.html',
    styleUrl: './attendance-admin.component.scss',
    standalone: false
})
export class AttendanceAdminComponent implements OnInit {
  initChecked = false;
  showTimePicker: Array<string> = [];
  date = new Date();
  myTime: Date = new Date();
  myDateValue!: Date;
  public selectedValue1 = '';
  public selectedValue2 = '';
  public selectedValue3 = '';
  selectedList1: data[] = [
    { value: 'Sort by Datee' },
    { value: 'Newest' },
    { value: 'Oldest' },
  ];
  selectedList2: data[] = [
    { value: 'Choose' },
    { value: 'Mitchum Daniel' },
    { value: 'Janet Hembre' },
    { value: 'Russell Belle' },
  ];
  selectedList3: data[] = [
    { value: 'Choose' },
    { value: 'Mitchum Daniel' },
    { value: 'Janet Hembre' },
    { value: 'Russell Belle' },
  ];
  public routes = routes;
  // pagination variables
  public tableData: Array<attendenceAdmin> = [];
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<attendenceAdmin>;
  public searchDataValue = '';
  //** / pagination variables

  constructor(
    private data: DataService,
    private pagination: PaginationService,
    private router: Router,
    private sidebar: SidebarService,
    private datePipe: DatePipe
  ) {
    this.data.getDataTable().subscribe((apiRes: apiResultFormat) => {
      this.totalData = apiRes.totalData;
      this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
        if (this.router.url == this.routes.attendanceAdmin) {
          this.getTableData({ skip: res.skip, limit: this.totalData });
          this.pageSize = res.pageSize;
        }
      });
    });
  }
  public searchData(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    this.tableData = this.dataSource.filteredData;
  }
  private getTableData(pageOption: pageSelection): void {
    this.data.getAttendanceAdmin().subscribe((apiRes: apiResultFormat) => {
      this.tableData = [];
      this.serialNumberArray = [];
      this.totalData = apiRes.totalData;
      apiRes.data.map((res: attendenceAdmin, index: number) => {
        const serialNumber = index + 1;
        if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
          res.sNo = serialNumber;
          this.tableData.push(res);
          this.serialNumberArray.push(serialNumber);
        }
      });
      this.dataSource = new MatTableDataSource<attendenceAdmin>(this.tableData);
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
  public filter = false;
  openFilter() {
    this.filter = !this.filter;
  }
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  selectedList4: data[] = [
    { value: 'Choose Name' },
    { value: 'Mitchum Daniel' },
    { value: 'Robert Grossman' },
    { value: 'Janet Hembre' },
  ];
  selectedList5: data[] = [
    { value: 'Choose Status' },
    { value: 'Approved' },
    { value: 'Rejected' },
  ];

  time1 = new Date();
  time2 = new Date();
  time3 = new Date();
  time4 = new Date();

  toggleTimePicker(value: string): void {
    if (this.showTimePicker[0] !== value) {
      this.showTimePicker[0] = value;
    } else {
      this.showTimePicker = [];
    }
  }
  formatTime(date: Date) {
    const selectedDate: Date = new Date(date);
    return this.datePipe.transform(selectedDate, 'h:mm a');
  }
  showBox = false;
  toggleBox() {
    this.showBox = !this.showBox;
  }
  ngOnInit() {
    this.myDateValue = new Date();
  }
  onDateChange(newDate: Date) {
    console.log(newDate);
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
}
