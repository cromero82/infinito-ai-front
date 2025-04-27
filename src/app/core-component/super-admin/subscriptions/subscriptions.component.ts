import { Component, ViewChild} from '@angular/core';



import { MatTableDataSource } from '@angular/material/table';

import { Router } from '@angular/router';
import { PaginationService, tablePageSize } from '../../../shared/custom-pagination/pagination.service';
import { Sort } from '@angular/material/sort';
import { apiResultFormat, DataService, pageSelection, routes, SidebarService } from 'src/app/core/core.index';
import { CompanyInfo } from 'src/app/shared/model/page.model';
import { ChartComponent } from 'ng-apexcharts';
import { ChartOptions } from 'chart.js';

@Component({
  selector: 'app-subscriptions',
  standalone: false,
  
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss'
})
export class SubscriptionsComponent {
  public routes = routes;
  @ViewChild('chart')
  chart!: ChartComponent;
  public Areachart: Partial<ChartOptions> | any;
  public Areachart2: Partial<ChartOptions> | any;
  public Areachart3: Partial<ChartOptions> | any;
  public Areachart4: Partial<ChartOptions> | any;
  initChecked = false;
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  // pagination variables
  public pageSize = 10;
  public tableData: CompanyInfo[] = [];
  public tableDataCopy: CompanyInfo[] = [];
  public actualData: CompanyInfo[] = [];
  public currentPage = 1;
  public skip = 0;
  public limit: number = this.pageSize;
  public serialNumberArray: number[] = [];
  public totalData = 0;
  showFilter = false;
  public pageSelection: pageSelection[] = [];
  dataSource!: MatTableDataSource<CompanyInfo>;
  public searchDataValue = '';
  public password: boolean[] = [false,false,false,false];
  togglePassword(index: number) {
    this.password[index] = !this.password[index];
  }
  constructor(
    private data: DataService,
    private router: Router,
    private pagination: PaginationService,
    private sidebar :SidebarService
  ) {

    this.data.getSubscription().subscribe((apiRes: apiResultFormat) => {
      this.actualData = apiRes.data;
      this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
        if (this.router.url == this.routes.superadminSubscriptions) {
          this.getTableData({ skip: res.skip, limit: res.limit });
          this.pageSize = res.pageSize;
        }
      });
    });
  }
  private getTableData(pageOption: pageSelection): void {
    this.data.getSubscription().subscribe((apiRes: apiResultFormat) => {
      this.tableData = [];
      this.tableDataCopy = [];
      this.serialNumberArray = [];
      this.totalData = apiRes.totalData;
      apiRes.data.map((res: CompanyInfo, index: number) => {
        const serialNumber = index + 1;
        if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
          res.sNo = serialNumber;
          this.tableData.push(res);
          this.tableDataCopy.push(res);
          this.serialNumberArray.push(serialNumber);
        }
      });
      this.dataSource = new MatTableDataSource<CompanyInfo>(this.actualData);
      this.pagination.calculatePageSize.next({
        totalData: this.totalData,
        pageSize: this.pageSize,
        tableData: this.tableData,
        tableDataCopy: this.tableDataCopy,
        serialNumberArray: this.serialNumberArray,
      });
    });
  }

  public searchData(value: string): void {
    if (value == '') {
      this.tableData = this.tableDataCopy;
    } else {
      this.dataSource.filter = value.trim().toLowerCase();
      this.tableData = this.dataSource.filteredData;
    }
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
  public changePageSize(pageSize: number): void {
    this.pageSelection = [];
    this.limit = pageSize;
    this.skip = 0;
    this.currentPage = 1;
    this.pagination.tablePageSize.next({
      skip: this.skip,
      limit: this.limit,
      pageSize: this.pageSize,
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
  ngOnInit(): void {
    this.Areachart = {
      series: [{
        name: "",
        data: [6,2,8,4,3,8,1,3,6,5,9,2,8,1,4,8,9,8,2,1]
      }],
      fill: {
        type: 'solid',
        opacity:1
      },
      chart: {
        foreColor: '#fff',
        type: "area",
        width: 80,
        toolbar: {
          show: !1
        },
        zoom: {
          enabled: !1
        },
        dropShadow: {
          enabled: 0,
          top: 3,
          left: 14,
          blur: 4,
          opacity: .12,
          color: "#fff"
        },
        sparkline: {
          enabled: !0
        }
      },
      markers: {
        size: 0,
        colors: ["#F7A37A"],
        strokeColors: "#fff",
        strokeWidth: 0,
        hover: {
          size: 7
        }
      },
      plotOptions: {
        bar: {
          horizontal: !1,
          columnWidth: "35%",
          endingShape: "rounded"
        }
      },
      dataLabels: {
        enabled: !1
      },
      // stroke: {
      //   show: !0,
      //   width: 2.5,
      //   curve: "smooth"
      // },
      stroke: {
        width: 0,
        curve: 'monotoneCubic'
      },
      colors: ["#F7A37A"],
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
      },
      tooltip: {
        theme: "dark",
        fixed: {
          enabled: !1
        },
        x: {
          show: !1
        },

        marker: {
          show: !1
        }
      }
    };
    this.Areachart2 = {
      series: [{
        name: "",
        data: [6,2,8,4,3,8,1,3,6,5,9,2,8,1,4,8,9,8,2,1]
      }],
      fill: {
        type: 'solid',
        opacity:1
      },
      chart: {
        foreColor: '#fff',
        type: "area",
        width: 80,
        toolbar: {
          show: !1
        },
        zoom: {
          enabled: !1
        },
        dropShadow: {
          enabled: 0,
          top: 3,
          left: 14,
          blur: 4,
          opacity: .12,
          color: "#fff"
        },
        sparkline: {
          enabled: !0
        }
      },
      markers: {
        size: 0,
        colors: ["#70B1FF"],
        strokeColors: "#fff",
        strokeWidth: 0,
        hover: {
          size: 7
        }
      },
      plotOptions: {
        bar: {
          horizontal: !1,
          columnWidth: "35%",
          endingShape: "rounded"
        }
      },
      dataLabels: {
        enabled: !1
      },
      // stroke: {
      //   show: !0,
      //   width: 2.5,
      //   curve: "smooth"
      // },
      stroke: {
        width: 0,
        curve: 'monotoneCubic'
      },
      colors: ["#70B1FF"],
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
      },
      tooltip: {
        theme: "dark",
        fixed: {
          enabled: !1
        },
        x: {
          show: !1
        },

        marker: {
          show: !1
        }
      }
    };
    this.Areachart3 = {
      series: [{
        name: "",
        data: [6,2,8,4,3,8,1,3,6,5,9,2,8,1,4,8,9,8,2,1]
      }],
      fill: {
        type: 'solid',
        opacity:1
      },
      chart: {
        foreColor: '#fff',
        type: "area",
        width: 80,
        toolbar: {
          show: !1
        },
        zoom: {
          enabled: !1
        },
        dropShadow: {
          enabled: 0,
          top: 3,
          left: 14,
          blur: 4,
          opacity: .12,
          color: "#fff"
        },
        sparkline: {
          enabled: !0
        }
      },
      markers: {
        size: 0,
        colors: ["#60DD97"],
        strokeColors: "#fff",
        strokeWidth: 0,
        hover: {
          size: 7
        }
      },
      plotOptions: {
        bar: {
          horizontal: !1,
          columnWidth: "35%",
          endingShape: "rounded"
        }
      },
      dataLabels: {
        enabled: !1
      },
      // stroke: {
      //   show: !0,
      //   width: 2.5,
      //   curve: "smooth"
      // },
      stroke: {
        width: 0,
        curve: 'monotoneCubic'
      },
      colors: ["#60DD97"],
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
      },
      tooltip: {
        theme: "dark",
        fixed: {
          enabled: !1
        },
        x: {
          show: !1
        },

        marker: {
          show: !1
        }
      }
    };
    this.Areachart4 = {
      series: [{
        name: "",
        data: [6,2,8,4,3,8,1,3,6,5,9,2,8,1,4,8,9,8,2,1]
      }],
      fill: {
        type: 'solid',
        opacity:1
      },
      chart: {
        foreColor: '#fff',
        type: "area",
        width: 80,
        toolbar: {
          show: !1
        },
        zoom: {
          enabled: !1
        },
        dropShadow: {
          enabled: 0,
          top: 3,
          left: 14,
          blur: 4,
          opacity: .12,
          color: "#fff"
        },
        sparkline: {
          enabled: !0
        }
      },
      markers: {
        size: 0,
        colors: ["#DE5555"],
        strokeColors: "#fff",
        strokeWidth: 0,
        hover: {
          size: 7
        }
      },
      plotOptions: {
        bar: {
          horizontal: !1,
          columnWidth: "35%",
          endingShape: "rounded"
        }
      },
      dataLabels: {
        enabled: !1
      },
      // stroke: {
      //   show: !0,
      //   width: 2.5,
      //   curve: "smooth"
      // },
      stroke: {
        width: 0,
        curve: 'monotoneCubic'
      },
      colors: ["#DE5555"],
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
      },
      tooltip: {
        theme: "dark",
        fixed: {
          enabled: !1
        },
        x: {
          show: !1
        },

        marker: {
          show: !1
        }
      }
    };
  }
}
