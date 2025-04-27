import { Component } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Editor, Toolbar } from 'ngx-editor';
import { SidebarService, apiResultFormat, routes } from 'src/app/core/core.index';
import { DataService } from 'src/app/core/service/data/data.service';
import { PaginationService, pageSelection, tablePageSize } from 'src/app/shared/custom-pagination/pagination.service';
import { holiday } from 'src/app/shared/model/page.model';
import Swal from 'sweetalert2';
interface data {
  value: string;
}

@Component({
    selector: 'app-holidays',
    templateUrl: './holidays.component.html',
    styleUrl: './holidays.component.scss',
    standalone: false
})
export class HolidaysComponent {
  initChecked = false;
  public routes = routes
  public selectedValue1 = '';
  public selectedValue2 = '';
  public selectedValue3 = '';
  public selectedValue4 = '';
  public selectedValue5 = '';
  selectedList1: data[] = [
    { value: 'Choose Status' },
    { value: 'Mitchum Daniel' },
    { value: 'Susan Lopez' },
   
  ];
  selectedList2: data[] = [
    { value: 'Sort by Date' },
    { value: 'Newest' },
    { value: 'Oldest' },
   
  ];
  editor!: Editor;
  editor1!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic', 'format_clear'],
    ['underline', 'strike'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['image'],
    ['link'],
  ];
// pagination variables
public tableData: Array<holiday> = [];
public pageSize = 10;
public serialNumberArray: Array<number> = [];
public totalData = 0;
showFilter = false;
dataSource!: MatTableDataSource<holiday>;
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
      if (this.router.url == this.routes.holidays) {
        this.getTableData({ skip: res.skip, limit: this.totalData  });
        this.pageSize = res.pageSize;
      }
    });
  });
}

private getTableData(pageOption: pageSelection): void {
  this.data.getHolidays().subscribe((apiRes: apiResultFormat) => {
    this.tableData = [];
    this.serialNumberArray = [];
    this.totalData = apiRes.totalData;
    apiRes.data.map((res: holiday, index: number) => {
      const serialNumber = index + 1;
      if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
        res.sNo = serialNumber;
        this.tableData.push(res);
        this.serialNumberArray.push(serialNumber);
      }
    });
    this.dataSource = new MatTableDataSource<holiday>(this.tableData);
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
  { value: 'Choose Holiday' },
  { value: 'UI/UX' },
  { value: 'HR' },
  { value: 'Admin' },
  { value: 'Engineering' },
 
];
selectedList5: data[] = [
  { value: 'Choose HOD' },
  { value: 'Mitchum Daniel' },
  { value: 'Susan Lopez' },
 
 
];
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
  this.editor1 = new Editor();
}
ngOnDestroy(): void {
  this.editor.destroy();
  this.editor1.destroy();
}
}
