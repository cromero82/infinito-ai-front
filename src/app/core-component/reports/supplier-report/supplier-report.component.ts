import { Component, Renderer2 } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { CommonService, DataService, SidebarService, apiResultFormat, pageSelection, routes } from 'src/app/core/core.index';
import { PaginationService, tablePageSize } from 'src/app/shared/custom-pagination/pagination.service';
import { supplierreport } from 'src/app/shared/model/page.model';

interface data {
  value: string;
}

@Component({
    selector: 'app-supplier-report',
    templateUrl: './supplier-report.component.html',
    styleUrl: './supplier-report.component.scss',
    standalone: false
})
export class SupplierReportComponent {
  initChecked = false;
  bsValue = new Date();
  bsRangeValue: Date[];
  maxDate = new Date();
  
  public tableData2: Array<supplierreport> = [];
  public tableData3: Array<supplierreport> = [];
  public routes = routes
   // pagination variables
   public tableData: Array<supplierreport> = [];
   public pageSize = 10;
   public serialNumberArray: Array<number> = [];
   public totalData = 0;
   showFilter = false;
   dataSource!: MatTableDataSource<supplierreport>;
   
   public searchDataValue = '';
   //** / pagination variables
 
   constructor(
     private data: DataService,
     private pagination: PaginationService,
     private router: Router,
     private sidebar: SidebarService,
     private common: CommonService,
     private renderer: Renderer2
   ) {
    this.maxDate.setDate(this.maxDate.getDate() + 7);
    this.bsRangeValue = [this.bsValue, this.maxDate];
    this.data.getSupplierReport().subscribe((apiRes: apiResultFormat) => {
      this.totalData = apiRes.totalData;
      this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
        if (this.router.url == this.routes.supplierReport) {
          this.getTableData({ skip: res.skip, limit: this.totalData  });
          this.pageSize = res.pageSize;
        }
      });
    });
    this.data.getSupplierpaymentReport().subscribe((apiRes: apiResultFormat) => {
      this.totalData = apiRes.totalData;
      this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
        if (this.router.url == this.routes.supplierReport) {
          this.getTableData2({ skip: res.skip, limit: this.totalData  });
          this.pageSize = res.pageSize;
        }
      });
    });
    this.data.getSupplierReturnReport().subscribe((apiRes: apiResultFormat) => {
      this.totalData = apiRes.totalData;
      this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
        if (this.router.url == this.routes.supplierReport) {
          this.getTableData3({ skip: res.skip, limit: this.totalData  });
          this.pageSize = res.pageSize;
        }
      });
    });
   }
 
   private getTableData(pageOption: pageSelection): void {
     this.data.getSupplierReport().subscribe((apiRes: apiResultFormat) => {
       this.tableData = [];
       this.serialNumberArray = [];
       this.totalData = apiRes.totalData;
       apiRes.data.map((res: supplierreport , index: number) => {
         const serialNumber = index + 1;
         if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
           res.sNo = serialNumber;
           this.tableData.push(res);
           this.serialNumberArray.push(serialNumber);
         }
       });
       this.dataSource = new MatTableDataSource<supplierreport>(this.tableData);
       this.pagination.calculatePageSize.next({
         totalData: this.totalData,
         pageSize: this.pageSize,
         tableData: this.tableData,
         serialNumberArray: this.serialNumberArray,
       });
     });
   }
   private getTableData2(pageOption: pageSelection): void {
    this.data.getSupplierpaymentReport().subscribe((apiRes: apiResultFormat) => {
      this.tableData2 = [];
      this.serialNumberArray = [];
      this.totalData = apiRes.totalData;
      apiRes.data.map((res: supplierreport, index: number) => {
        const serialNumber = index + 1;
        if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
          res.sNo = serialNumber;
          this.tableData2.push(res);
          this.serialNumberArray.push(serialNumber);
        }
      });
      this.dataSource = new MatTableDataSource<supplierreport>(this.tableData2);
      this.pagination.calculatePageSize.next({
        totalData: this.totalData,
        pageSize: this.pageSize,
        tableData2: this.tableData2,
        serialNumberArray: this.serialNumberArray,
        tableData: []
      });
    });
  }
  private getTableData3(pageOption: pageSelection): void {
    this.data.getSupplierReturnReport().subscribe((apiRes: apiResultFormat) => {
      this.tableData3 = [];
      this.serialNumberArray = [];
      this.totalData = apiRes.totalData;
      apiRes.data.map((res:  supplierreport, index: number) => {
        const serialNumber = index + 1;
        if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
          res.sNo = serialNumber;
          this.tableData3.push(res);
          this.serialNumberArray.push(serialNumber);
        }
      });
      this.dataSource = new MatTableDataSource<supplierreport>(this.tableData2);
      this.pagination.calculatePageSize.next({
        totalData: this.totalData,
        pageSize: this.pageSize,
        tableData2: this.tableData3,
        serialNumberArray: this.serialNumberArray,
        tableData: []
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
   public selectedValue11 = '';
   public selectedValue12 = '';


   selectedList1: data[] = [
     { value: 'Sort by Date' },
     { value: '27 9 23' },
     { value: '10 9 23' },
   ];
   selectedList2: data[] = [
     { value: 'Choose Product' },
     { value: 'Apple Series 5 Watch' },
     { value: 'Amazon Echo Dot' }
     
   ];
   selectedList3: data[] = [
     { value: 'Choose Status' },
     { value: 'Received' },
    
     
   ];
   selectedList4: data[] = [
     { value: 'Payment Method' },
     { value: 'Paypal' },
     { value: 'Stripe' },
   ];
   selectedList5: data[] = [
     { value: 'Choose Payment Status' },
     { value: 'Paid' },
     { value: 'Unpaid' },
     { value: 'Overdue' },
   ];
   selectedList6: data[] = [
    { value: 'Sort by Date' },
    { value: '27 9 23' },
    { value: '10 9 23' },
  ];
  selectedList7: data[] = [
    { value: 'Choose Supplier Name' },
    { value: 'Apex Computers' },
    { value: 'Beats Headphones' },
  ];
  selectedList8: data[] = [
    { value: 'Sort by Date' },
    { value: '27 9 23' },
    { value: '10 9 23' },
  ];
  selectedList9: data[] = [
    { value: 'Choose Supplier Name' },
    { value: 'Apex Computers' },
    { value: 'Beats Headphones' },
  ];
  selectedList10: data[] = [
    { value: 'Choose Supplier Name' },
    { value: 'Apex Computers' },
    { value: 'Beats Headphones' },
  ];
  selectedList11: data[] = [
    { value: 'Choose Status' },
    { value: 'Completed' },
    { value: 'Incompleted' },
  ];
  selectedList12: data[] = [
    { value: 'Choose Payment Status' },
    { value: 'Paid' },
    { value: 'Unpaid' },
    { value: 'Overdue' },
    
  ];
 
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
