import { Component } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { SidebarService, apiResultFormat, routes } from 'src/app/core/core.index';
import { DataService } from 'src/app/core/service/data/data.service';
import { customFiled } from 'src/app/shared/model/page.model';
import { PaginationService, pageSelection, tablePageSize } from 'src/app/shared/shared.index';
import Swal from 'sweetalert2';
interface data {
  value: string;
}

@Component({
    selector: 'app-custom-fields',
    templateUrl: './custom-fields.component.html',
    styleUrl: './custom-fields.component.scss',
    standalone: false
})
export class CustomFieldsComponent {
  initChecked = false;
  public routes = routes;
   // pagination variables
   public tableData: Array<customFiled> = [];
   public pageSize = 10;
   public serialNumberArray: Array<number> = [];
   public totalData = 0;
   showFilter = false;
   dataSource!: MatTableDataSource<customFiled>;
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
        if (this.router.url == this.routes.customFields) {
          this.getTableData({ skip: res.skip, limit: this.totalData  });
          this.pageSize = res.pageSize;
        }
      });
    });
   }
 
   private getTableData(pageOption: pageSelection): void {
     this.data.getCustomfield().subscribe((apiRes: apiResultFormat) => {
       this.tableData = [];
       this.serialNumberArray = [];
       this.totalData = apiRes.totalData;
       apiRes.data.map((res: customFiled, index: number) => {
         const serialNumber = index + 1;
         if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
           res.sNo = serialNumber;
           this.tableData.push(res);
           this.serialNumberArray.push(serialNumber);
         }
       });
       this.dataSource = new MatTableDataSource<customFiled>(this.tableData);
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
   selectedList1: data[] = [
    { value: 'Sort by Date' },
    { value: 'Newest' },
    { value: 'Oldest' },
  ];
  selectedList2: data[] = [
    { value: 'Choose Module' },
    { value: 'Expense' },
    { value: 'Transaction' },
  ];
  selectedList3: data[] = [
    { value: 'Choose Fields' },
    { value: 'Expense' },
    { value: 'Transaction' },
  ];
  selectedList4: data[] = [
    { value: 'Choose Status' },
    { value: 'Active' },
    { value: 'Inactive' },
  ];
  selectedList5: data[] = [
    { value: 'Choose' },
    { value: 'Expense' },
    { value: 'Transaction' },
  ];
  selectedList6: data[] = [
    { value: 'Choose' },
    { value: 'Text' },
    { value: 'Textarea' },
  ];
  selectedList7: data[] = [
    { value: 'Expense' },
    { value: 'Transaction' },
   
  ];
  selectedList8: data[] = [
    { value: 'Expense' },
    { value: 'Transaction' },
   
  ];
  public filter = false;
  openFilter() {
    this.filter = !this.filter;
  }
  public searchData(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    this.tableData = this.dataSource.filteredData;
  }
  showBox = false;
toggleBox() {
  this.showBox = !this.showBox;
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
