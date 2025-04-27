import { Component } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { SidebarService, apiResultFormat, routes } from 'src/app/core/core.index';
import { DataService } from 'src/app/core/service/data/data.service';
import { expiredProducts } from 'src/app/shared/model/page.model';
import { PaginationService, pageSelection, tablePageSize } from 'src/app/shared/shared.index';
import Swal from 'sweetalert2';
interface data {
  value: string;
}

@Component({
    selector: 'app-expired-products.',
    templateUrl: './expired-products.component.html',
    styleUrl: './expired-products.component.scss',
    standalone: false
})
export class ExpiredProductsComponent {
  initChecked = false;
  public routes = routes
  public selectedValue1 = '';
  public selectedValue2 = '';
// pagination variables
public tableData: Array<expiredProducts> = [];
public pageSize = 10;
public serialNumberArray: Array<number> = [];
public totalData = 0;
showFilter = false;
dataSource!: MatTableDataSource<expiredProducts>;
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
      if (this.router.url == this.routes.expiredProduct) {
        this.getTableData({ skip: res.skip, limit: this.totalData  });
        this.pageSize = res.pageSize;
      }
    });
  });
}

private getTableData(pageOption: pageSelection): void {
  this.data.getExpiredproduct().subscribe((apiRes: apiResultFormat) => {
    this.tableData = [];
    this.serialNumberArray = [];
    this.totalData = apiRes.totalData;
    apiRes.data.map((res: expiredProducts, index: number) => {
      const serialNumber = index + 1;
      if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
        res.sNo = serialNumber;
        this.tableData.push(res);
        this.serialNumberArray.push(serialNumber);
      }
    });
    this.dataSource = new MatTableDataSource<expiredProducts>(this.tableData);
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
selectedList1: data[] = [
  { value: 'Sort by Date' },
  { value: 'Newest' },
  { value: 'Oldest' },
];
selectedList2: data[] = [
  { value: 'Choose Type' },
  { value: 'Lenovo 3rd Generation' },
  { value: 'Nike Jordan' },
];

public filter = false;
openFilter() {
  this.filter = !this.filter;
}
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
public searchData(value: string): void {
  this.dataSource.filter = value.trim().toLowerCase();
  this.tableData = this.dataSource.filteredData;
}
confirmColor() {
  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: ' btn btn-success',
      cancelButton: 'me-2 btn btn-danger',
    },
    buttonsStyling: false,
  });

  swalWithBootstrapButtons
    .fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    })
    .then((result) => {
      if (result.isConfirmed) {
        swalWithBootstrapButtons.fire(
          'Deleted!',
          'Your file has been deleted.',
          'success'
        );
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        swalWithBootstrapButtons.fire(
          'Cancelled',
          'Your imaginary file is safe :)',
          'error'
        );
      }
    });
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
