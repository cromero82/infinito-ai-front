import { Component, ElementRef, Renderer2 } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { DataService, SidebarService, apiResultFormat, pageSelection } from 'src/app/core/core.index';
import { routes } from 'src/app/core/helpers/routes';
import { pospurchase } from 'src/app/shared/model/page.model';
import { PaginationService, tablePageSize } from 'src/app/shared/shared.index';
import Swal from 'sweetalert2';
interface data {
  value: string;
}
@Component({
  selector: 'app-pos-2',
  standalone: false,
  
  templateUrl: './pos-2.component.html',
  styleUrl: './pos-2.component.scss'
})
export class Pos2Component {
istab=true;
  istab2=false;
  istab3=false;
  istab4=false;
  istab5=false;
  istab6=false;
  public selectedValue1 = '';
  public selectedValue2 = '';
  public selectedValue3 = '';
  public selectedValue4 = '';
  public selectedValue5 = '';
  public selectedValue6 = '';
  public selectedValue7 = '';
  public selectedValue8 = '';
  selectedList1: data[] = [
    { value: 'Walk in Customer' },
    { value: 'John' },
    { value: 'Smith' },
    { value: 'Ana' },
    { value: 'Elza' },
  ];
  selectedList2: data[] = [
    { value: 'Search Products' },
    { value: 'IPhone 14 64GB' },
    { value: 'MacBook Pro' },
    { value: 'Rolex Tribute V3' },
    { value: 'Red Nike Angelo' },
    { value: 'Airpod 2' },
    { value: 'Oldest' },
  ];
  selectedList3: data[] = [
    { value: 'GST 5%' },
    { value: 'GST 10%' },
    { value: 'GST 15%' },
    { value: 'GST 20%' },
    { value: 'GST 25%' },
    { value: 'GST 30%' },
    { value: 'GST 30%' },
  ];
  selectedList4: data[] = [
    { value: '15' },
    { value: '20' },
    { value: '25' },
    { value: '30' },
    
  ];
  selectedList5: data[] = [
    { value: '10%' },
    { value: '20%' },
    { value: '25%' },
    { value: '30%' },
    
  ];
  selectedList6: data[] = [
    { value: 'Kilogram' },
    { value: 'Grams' },
    
    
  ];
  selectedList7: data[] = [
    { value: 'Percentage' },
    { value: 'Early payment discounts' },
    { value: '25%' },
    { value: '30%' },
    
  ];
  selectedList8: data[] = [
    { value: 'Exclusive' },
    { value: 'Inclusive' },
  ];
  

  customOptions: OwlOptions = {
    margin: 10,
    dots: false,
    nav: true,
    navText: [
      '<i class="fas fa-chevron-left"></i>',
      '<i class="fas fa-chevron-right"></i>',
    ],
    loop: false,
    touchDrag: false,
    mouseDrag: false,
    responsive: {
      0: {
        items: 2,
      },
      768: {
        items: 6,
      },
      991: {
        items: 6,
      },
      1200: {
        items: 6,
      },
      1170: {
        items: 6,
      },
    },
  };
  quantity: number = 4;
  increment() {
    this.quantity++;
  }

  decrement() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
  public cartValue = [4,4];
  public addPos(i: number): void {
    this.cartValue[i]++;
  }
  public reducePos(i: number): void {
    this.cartValue[i]--;
  }
  public routes = routes;
  // pagination variables
  public tableData: Array<pospurchase> = [];
  public tableData2: Array<pospurchase> = [];
  public tableData3: Array<pospurchase> = [];


  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<pospurchase>;
  public searchDataValue = '';
  //** / pagination variables

  constructor(
    private data: DataService,
    private pagination: PaginationService,
    private router: Router,
    private sidebar: SidebarService,
    private renderer: Renderer2, private el: ElementRef
  ) {
    this.data.getPosPurchase().subscribe((apiRes: apiResultFormat) => {
      this.totalData = apiRes.totalData;
      this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
        if (this.router.url == this.routes.pos) {
          this.getTableData({ skip: res.skip, limit: this.totalData  });
          this.pageSize = res.pageSize;
        }
      });
    });
    this.data.getPosPurchase().subscribe((apiRes: apiResultFormat) => {
      this.totalData = apiRes.totalData;
      this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
        if (this.router.url == this.routes.pos) {
          this.getTableData2({ skip: res.skip, limit: this.totalData  });
          this.pageSize = res.pageSize;
        }
      });
    });
    this.data.getPosPurchase().subscribe((apiRes: apiResultFormat) => {
      this.totalData = apiRes.totalData;
      this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
        if (this.router.url == this.routes.pos) {
          this.getTableData3({ skip: res.skip, limit: this.totalData  });
          this.pageSize = res.pageSize;
        }
      });
    });
  }

  private getTableData(pageOption: pageSelection): void {
    this.data.getPosPurchase().subscribe((apiRes: apiResultFormat) => {
      this.tableData = [];
      this.serialNumberArray = [];
      this.totalData = apiRes.totalData;
      apiRes.data.map((res: pospurchase, index: number) => {
        const serialNumber = index + 1;
        if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
          res.sNo = serialNumber;
          this.tableData.push(res);
          this.serialNumberArray.push(serialNumber);
        }
      });
      this.dataSource = new MatTableDataSource<pospurchase>(this.tableData);
      this.pagination.calculatePageSize.next({
        totalData: this.totalData,
        pageSize: this.pageSize,
        tableData: this.tableData,
        serialNumberArray: this.serialNumberArray,
      });
    });
  }
  private getTableData2(pageOption: pageSelection): void {
    this.data.getPosPurchase().subscribe((apiRes: apiResultFormat) => {
      this.tableData2 = [];
      this.serialNumberArray = [];
      this.totalData = apiRes.totalData;
      apiRes.data.map((res: pospurchase, index: number) => {
        const serialNumber = index + 1;
        if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
          res.sNo = serialNumber;
          this.tableData2.push(res);
          this.serialNumberArray.push(serialNumber);
        }
      });
      this.dataSource = new MatTableDataSource<pospurchase>(this.tableData2);
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
    this.data.getPosPurchase().subscribe((apiRes: apiResultFormat) => {
      this.tableData3 = [];
      this.serialNumberArray = [];
      this.totalData = apiRes.totalData;
      apiRes.data.map((res: pospurchase, index: number) => {
        const serialNumber = index + 1;
        if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
          res.sNo = serialNumber;
          this.tableData3.push(res);
          this.serialNumberArray.push(serialNumber);
        }
      });
      this.dataSource = new MatTableDataSource<pospurchase>(this.tableData2);
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
  
  
  // public ngAfterViewInit(): void {
  //   window.dispatchEvent(new Event('resize'));
  // }
  openTab():void{
    this.istab=true;
  }
  openTab2():void{
    this.istab2=true;
    this.istab=false;
    this.istab3=false;
    this.istab4=false;
    this.istab5=false;
    this.istab6=false;


  }
  openTab3():void{
    this.istab3=true;
    this.istab=false;
    this.istab2=false;
    this.istab4=false;
    this.istab5=false;
    this.istab6=false;
  }
  openTab4():void{
    this.istab4=true;
    this.istab=false;
    this.istab3=false;
    this.istab2=false;
    this.istab5=false;
    this.istab6=false;
  }
  openTab5():void{
    this.istab5=true;
    this.istab=false;
    this.istab3=false;
    this.istab4=false;
    this.istab2=false;
    this.istab6=false;
  }
  openTab6():void{
    this.istab6=true;
    this.istab=false;
    this.istab3=false;
    this.istab4=false;
    this.istab5=false;
    this.istab2=false;
  }
  ngAfterViewInit(): void {
    const divElements = this.el.nativeElement.querySelectorAll('.product-info.card');
    divElements.forEach((divElement: HTMLElement) => {
      this.renderer.listen(divElement, 'click', () => {
        if (divElement.classList.contains('active')) {
          this.renderer.removeClass(divElement, 'active');
        } else {
          this.renderer.addClass(divElement, 'active');
        }
      });
    });
  }
}
