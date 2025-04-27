import { Component } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { SidebarService, apiResultFormat } from 'src/app/core/core.index';
import { routes } from 'src/app/core/helpers/routes';
import { DataService } from 'src/app/core/service/data/data.service';
import { attendenceEmployee } from 'src/app/shared/model/page.model';
import { PaginationService, pageSelection, tablePageSize } from 'src/app/shared/shared.index';
interface data {
  value: string;
}

@Component({
    selector: 'app-attendance-employee',
    templateUrl: './attendance-employee.component.html',
    styleUrl: './attendance-employee.component.scss',
    standalone: false
})
export class AttendanceEmployeeComponent {
  initChecked = false;
  public selectedValue1 = '';
  public selectedValue2 = '';

  selectedList1: data[] = [
    { value: 'Sort by Datee' },
    { value: 'Newest' },
    { value: 'Oldest' },
  ];
  selectedList2: data[] = [
    { value: 'Choose Status' },
    { value: 'Present' },
    { value: 'Absent' },
    { value: 'Holiday' },
  ];
  public routes = routes
   // pagination variables
   public tableData: Array<attendenceEmployee> = [];
   public pageSize = 10;
   public serialNumberArray: Array<number> = [];
   public totalData = 0;
   showFilter = false;
   dataSource!: MatTableDataSource<attendenceEmployee>;
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
        if (this.router.url == this.routes.attendanceEmployee) {
          this.getTableData({ skip: res.skip, limit: this.totalData  });
          this.pageSize = res.pageSize;
        }
      });
    });
   }
 
   private getTableData(pageOption: pageSelection): void {
     this.data.getAttendanceEmployee().subscribe((apiRes: apiResultFormat) => {
       this.tableData = [];
       this.serialNumberArray = [];
       this.totalData = apiRes.totalData;
       apiRes.data.map((res:attendenceEmployee, index: number) => {
         const serialNumber = index + 1;
         if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
           res.sNo = serialNumber;
           this.tableData.push(res);
           this.serialNumberArray.push(serialNumber);
         }
       });
       this.dataSource = new MatTableDataSource<attendenceEmployee>(this.tableData);
       this.pagination.calculatePageSize.next({
         totalData: this.totalData,
         pageSize: this.pageSize,
         tableData: this.tableData,
         serialNumberArray: this.serialNumberArray,
       });
     });
   }
   public searchData(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    this.tableData = this.dataSource.filteredData;
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

}
