import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { routes } from '../../core.index';
import { SideBar, SideBarMenu } from 'src/app/shared/model/page.model';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private collapseSubject = new BehaviorSubject<boolean>(false);
  collapse$ = this.collapseSubject.asObservable();

  toggleCollapse() {
    this.collapseSubject.next(!this.collapseSubject.value);
  }

  public sideBarPosition: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('sideBarPosition') || 'false'
  );

  public toggleMobileSideBar: BehaviorSubject<string> =
    new BehaviorSubject<string>(
      localStorage.getItem('isMobileSidebar') || 'false'
    );

  public expandSideBar: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  public switchSideMenuPosition(): void {
    if (localStorage.getItem('sideBarPosition')) {
      this.sideBarPosition.next('false');
      this.expandSideBar.next(true);
      localStorage.removeItem('sideBarPosition');
    } else {
      this.sideBarPosition.next('true');
      this.expandSideBar.next(false);
      localStorage.setItem('sideBarPosition', 'true');
    }
  }

  public switchMobileSideBarPosition(): void {
    if (localStorage.getItem('isMobileSidebar')) {
      this.toggleMobileSideBar.next('false');
      localStorage.removeItem('isMobileSidebar');
    } else {
      this.toggleMobileSideBar.next('true');
      localStorage.setItem('isMobileSidebar', 'true');
    }
  }

  public sidebarData1 = [
    {
      tittle: 'Main',
      showAsTab: false,
      separateRoute: false,
      hasSubRoute: false,
      showSubRoute: true,
      menu: [
        {
          menuValue: 'Dashboard',
          hasSubRoute: true,
          showSubRoute: true,
          icon2: 'layout-grid',
          base1: 'dashboard',

          subMenus: [
            {
              menuValue: 'Admin Dashboard',
              route: routes.index,
            },
            {
              menuValue: 'Admin Dashboard 2',
              route: routes.adminDashboard,
            },
            {
              menuValue: 'Sales Dashboard',
              route: routes.salesDashboard,
            },
          ],
        },
        {
          menuValue: 'Super Admin',
          hasSubRoute: true,
          showSubRoute: false,
          icon2: 'user-edit',
          base: 'super-admin',
          subMenus: [
            {
              menuValue: 'Dashboard',
              route: routes.superadminDashboard,
              base:'dashboard'
            },
            {
              menuValue: 'Companies',
              route: routes.superadminCompanies,
              base:'dashboard'
            },
            {
              menuValue: 'Subscriptions',
              route: routes.superadminSubscriptions,
            },
            {
              menuValue: 'Packages',
              route: routes.superadminPackages,
            },
            {
              menuValue: 'Domain',
              route: routes.superadminDomain,
            },
            {
              menuValue: 'Purchase Transaction',
              route: routes.purchaseTransaction,
            },
          ],
        },
        {
          menuValue: 'Application',
          hasSubRouteTwo: true,
          showSubRoute: false,
          base: 'application',
          icon2: 'brand-apple-arcade',
          subMenus: [
            {
              menuValue: 'Chat',
              route: routes.chat,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Call',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              page1: 'video-call',
              page2: 'audio-call',
              page3: 'call-history',
              subMenusTwo: [
                {
                  menuValue: 'Video Call',
                  route: routes.videoCall,
                  hasSubRoute: false,
                  showSubRoute: false,
                  page: 'call',
                },
                {
                  menuValue: 'Audio Call',
                  route: routes.audioCall,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Call History',
                  route: routes.callHistory,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              menuValue: 'Calendar',
              route: routes.calendar,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Contacts',
              route: routes.contacts,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Email',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.email,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              menuValue: 'To Do',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.toDo,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              menuValue: 'Notes',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.notes,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              menuValue: 'File Manager',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.fileManager,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              menuValue: 'Projects',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.kanban,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              menuValue: 'Ecommerce',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Products',
                  route: routes.products,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Orders',
                  route: routes.orders,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Customers',
                  route: routes.ecommerceCustomers,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Cart',
                  route: routes.cart,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Checkout',
                  route: routes.checkout,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Wishlist',
                  route:routes.wishlist,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Reviews',
                  route: routes.reviews,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              menuValue: 'Social Feeds',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.socialFeed,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              menuValue: 'Search List',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.searchList,
              customSubmenuTwo: false,
              subRoutes: [],
            },
          ],
        },
        {
          menuValue: 'Layouts',
          hasSubRoute: true,
          showSubRoute: false,
          icon2: 'layout-sidebar-right-collapse',
          base: 'layout',
          subMenus: [
            {
              menuValue: 'Horizontal',
              route: routes.Horizontal,
            },
            {
              menuValue: 'Detached',
              route: routes.Detached,
            },
            
            {
              menuValue: 'Two Column',
              route: routes.TwoColumn,
            },
            {
              menuValue: 'Boxed',
              route: routes.Boxed,
            },
            {
              menuValue: 'RTL',
              route: routes.RTL,
            },
            {
              menuValue: 'Dark',
              route: routes.Dark,
            },
          ],
        },
      ],
    },
    {
      tittle: 'Inventory',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Products',
          icon: 'box',
          route: routes.productList,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Create Product',
          icon2: 'table-plus',
          route: routes.addProduct,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Expired Products',
          icon2: 'progress-alert',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.expiredProduct,
          subRoutes: [],
        },
        {
          menuValue: 'Low Stocks',
          icon2: 'trending-up-2',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.lowStock,
          subRoutes: [],
        },
        {
          menuValue: 'Category',
          icon2: 'list-details',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.categoryList,
          subRoutes: [],
        },
        {
          menuValue: 'Sub Category',
          icon2: 'carousel-vertical',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.subCategories,
          subRoutes: [],
        },
        {
          menuValue: 'Brands',
          icon2: 'triangles',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.brandList,
          subRoutes: [],
        },
        {
          menuValue: 'Units',
          icon2: 'brand-unity',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.units,
          subRoutes: [],
        },
        {
          menuValue: 'Variant Attributes',
          icon2: 'checklist ',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.varriantAttributes,
          subRoutes: [],
        },
        {
          menuValue: 'Warranties',
          icon2: 'certificate ',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.warranty,
          subRoutes: [],
        },
        {
          menuValue: 'Print Barcode',
          icon2: 'barcode',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.barCode,
          subRoutes: [],
        },
        {
          menuValue: 'Print QR Code',
          icon2: 'qrcode',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.qrCode,
          subRoutes: [],
        },
      ],
    },
    {
      tittle: 'Stock',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Manage Stock',
          icon2: 'stack-3',
          route: routes.manageStocks,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Stock Adjustment',
          icon2: 'stairs-up',
          route: routes.stockAdjustment,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Stock Transfer',
          icon2: 'stack-pop',
          route: routes.stockTransfer,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },

    {
      tittle: 'Sales',
      showAsTab: true,
      separateRoute: false,
      hasSubRoute: false,
      showSubRoute: true,
      menu: [
        {
          menuValue: 'Sales',
          icon2: 'layout-grid',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Online Orders',
              route: routes.salesList,
            },
            {
              menuValue: 'POS Orders',
              route: routes.PosOrder,
            },
          ]
        },
        {
          menuValue: 'Invoices',
          icon2: 'file-invoice',
          route: routes.invoice,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Sales Return',
          icon2: 'receipt-refund',
          route: routes.salesReturn,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Quotation',
          icon2: 'files',
          route: routes.quotationList,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'POS',
          icon2: 'device-laptop',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'pos 1',
              route: routes.pos,
            },
            {
              menuValue: 'Pos 2',
              route: routes.pos2,
            },
            {
              menuValue: 'Pos 3',
              route: routes.pos3,
            },
            {
              menuValue: 'Pos 4',
              route: routes.pos4,
            },
            {
              menuValue: 'Pos 5',
              route: routes.pos5,
            },
          ]
        },
      ],
    },

    {
      tittle: 'Promo',
      showAsTab: true,
      separateRoute: false,
      hasSubRoute: false,
      showSubRoute: true,
      menu: [
        {
          menuValue: 'Coupons',
          icon2: 'ticket',
          route: routes.coupons,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Gift Cards',
          icon2: 'cards',
          route: routes.giftCards,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Discount',
          icon2: 'file-percent',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Discount Plan',
              route: routes.discountPlan,
            },
            {
              menuValue: 'Discount',
              route: routes.discount,
            },
          ]
        },
      ],
    },
    {
      tittle: 'Purchases',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Purchases',
          icon2: 'shopping-bag',
          route: routes.purchaseList,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Purchase Order',
          icon2: 'file-unknown',
          route: routes.purchaseOrderReport,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Purchase Return',
          icon2: 'file-upload',
          route: routes.purchaseReturns,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },

    {
      tittle: 'Finance & Accounts',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Expenses',
          base: 'expense',
          icon2: 'file-stack',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Expenses',
              route: routes.expenseList,
            },
            {
              menuValue: 'Expense Category',
              route: routes.expenseCategory,
            },
          ],
        },
        {
          menuValue: 'Income',
          base: 'income',
          icon2: 'file-pencil',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Income',
              route: routes.income,
            },
            {
              menuValue: 'Income Category',
              route: routes.incomeCategory,
            },
          ],
        },
        {
          menuValue: 'Bank Accounts',
          icon2: 'building-bank ',
          route: routes.accountList,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Money Transfer',
          icon2: 'moneybag',
          route: routes.moneyTransfer,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Balance Sheet',
          icon2: 'report-money',
          route: routes.balanceSheet,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Trail Balance',
          icon2: 'alert-circle',
          route: routes.trailBalance,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Cash Flow',
          icon2: 'zoom-money',
          route: routes.cashFlow,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Account Statement',
          icon2: 'file-infinity ',
          route: routes.accountStatement,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },

    {
      tittle: 'Peoples',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Customers',
          icon2: 'users-group',
          route: routes.customers,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Billers',
          icon2: 'user-up',
          route: routes.billers,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Suppliers',
          icon2: 'user-dollar',
          route: routes.suppliers,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Stores',
          icon2: 'home-bolt',
          route: routes.storeList,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Warehouses',
          icon2: 'archive',
          route: routes.wareHouse,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
    {
      tittle: 'HRM',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Employees',
          icon2: 'user',
          route: routes.employeesGrid,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Departments',
          icon2: 'compass',
          route: routes.departmentGrid,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Designation',
          icon2: 'git-merge',
          route: routes.designation,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Shifts',
          icon2: 'arrows-shuffle',
          route: routes.shift,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Attendance',
          icon2: 'user-cog',
          page: 'attendance',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Employee',
              route: routes.attendanceEmployee,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Admin',
              route: routes.attendanceAdmin,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
        {
          menuValue: 'Leaves',
          icon2: 'calendar',
          page: 'leaves',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Admin Leaves',
              route: routes.leavesAdmin,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Employee Leaves',
              route: routes.leavesEmployee,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Leave Types',
              route: routes.leavesType,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
        {
          menuValue: 'Holidays',
          icon2: 'calendar-share',
          route: routes.holidays,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Payroll',
          icon2: 'file-dollar',
          page: 'payroll',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Employee Salary',
              route: routes.payrollList,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Payslip',
              route: routes.paySlip,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
      ],
    },
    {
      tittle: 'Reports',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Sales Report',
          icon2: 'chart-bar',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus:[
              { 
                menuValue: 'Sales Report',
                route: routes.salesReport,
            },
              { 
                menuValue: 'Best Seller',
                route: routes.bestSeller,
            },
          ]
        },
        {
          menuValue: 'Purchase Report',
          icon2: 'chart-pie-2',
          route: routes.purchaseReport,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Inventory Report',
          icon2: 'triangle-inverted',
          
          hasSubRoute: true,
          showSubRoute: false,
          subMenus:[
              { 
                menuValue: 'Inventory Report',
                route: routes.inventoryReport,
            },
              { 
                menuValue: 'Stock History',
                route: routes.stockHistory,
            },
              { 
                menuValue: 'Stock Sold',
                route: routes.soldStock,
            },
          ]
        },
        {
          menuValue: 'Invoice Report',
          icon2: 'businessplan',
          route: routes.invoiceReport,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Supplier Report',
          icon2: 'user-star',
        
          hasSubRoute: true,
          showSubRoute: false,
          subMenus:[
              { 
                menuValue: 'Supplier Report',
                route: routes.supplierReport,
            },
              { 
                menuValue: 'Supplier Due Report',
                route: routes.supplierDueReport,
            },
          ]
        },
        {
          menuValue: 'Customer Report',
          icon2: 'report',
         
          hasSubRoute: true,
          showSubRoute: false,
          subMenus:[
              { 
                menuValue: 'Customer Report',
                route: routes.customerReport,
            },
              { 
                menuValue: 'Customer Due Report',
                route: routes.customerDueReport,
            },
          ]
        },
        {
          menuValue: 'Product Report',
          icon2: 'report-analytics',
          route: '/re',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus:[
              { 
                menuValue: 'Product Report',
                route: routes.productReport,
            },
              { 
                menuValue: 'Product Expiry Report',
                route: routes.productExpiryReport,
            },
              { 
                menuValue: 'Product Quantity Alert',
                route: routes.productQuantityAlert,
            },
          ]
        },
        {
          menuValue: 'Expense Report',
          icon2: 'file-vector',
          route: routes.expenseReport,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Income Report',
          icon2: 'chart-ppf',
          route: routes.incomeReport,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Tax Report',
          icon2: 'chart-dots-2',
          route: routes.taxReport,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Profit & Loss',
          icon2: 'chart-donut',
          route: routes.profitAndLoss,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Annual Report',
          icon2: 'report-search',
          route: routes.annualReport,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
    {
      tittle: 'Content (CMS)',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Pages',
          icon2: 'page-break',
         
          hasSubRoute: true,
          showSubRoute: false,
          subMenus:[
              { 
                menuValue: 'Pages',
                route: routes.page,
            },
          ]
        },
        {
          menuValue: 'Blogs',
          icon2: 'wallpaper',
          route: '/blog',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus:[
              { 
                menuValue: 'All Blogs',
                route: routes.allBlog,
            },
              { 
                menuValue: 'Blog Tags',
                route: routes.blogTag,
            },
              { 
                menuValue: 'Categories',
                route: routes.categories,
            },
              { 
                menuValue: 'Blog Comments',
                route: routes.blogComments,
            },
          ]
        },
        {
          menuValue: 'Location',
          icon2: 'map-pin',
        
          hasSubRoute: true,
          showSubRoute: false,
          subMenus:[
              { 
                menuValue: 'Countries',
                route: routes.countries,
            },
              { 
                menuValue: 'States',
                route: routes.states,
            },
              { 
                menuValue: 'Cities',
                route: routes.cities,
            },
          ]
        },
        {
          menuValue: 'Testimonials',
          icon2: 'star',
          route: routes.testimonial,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'FAQ',
          icon2: 'help-circle',
          route: routes.faq,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
    {
      tittle: 'User Management',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Users',
          icon2: 'shield-up',
          route: routes.users,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Roles & Permissions',
          icon2: 'jump-rope',
          route: routes.rolesPermission,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Delete Account Request',
          icon2: 'trash-x',
          route: routes.deleteaccount,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
    {
      tittle: 'Pages',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Profile',
          icon2: 'user-circle',
          route: routes.profile,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Authentication',
          icon2: 'shield',
          hasSubRouteTwo: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Login',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Cover',
                  route: routes.signIn,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Illustration',
                  route: routes.signIn2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Basic',
                  route: routes.signIn3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              menuValue: 'Register',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Cover',
                  route: routes.register,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Illustration',
                  route: routes.register2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Basic',
                  route: routes.register3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              menuValue: 'Forgot Password',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Cover',
                  route: routes.forgotPassword,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Illustration',
                  route: routes.forgotPassword2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Basic',
                  route: routes.forgotPassword3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              menuValue: 'Reset Password',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Cover',
                  route: routes.resetPassword,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Illustration',
                  route: routes.resetPassword2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Basic',
                  route: routes.resetPassword3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              menuValue: 'Email Verification',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Cover',
                  route: routes.emailVerification,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Illustration',
                  route: routes.emailVerification2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Basic',
                  route: routes.emailVerification3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              menuValue: '2 Step Verification',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Cover',
                  route: routes.twoStepVerification,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Illustration',
                  route: routes.twoStepVerification2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Basic',
                  route: routes.twoStepVerification3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              menuValue: 'Lock Screen',
              base:'lock-screen',
              route: routes.lockScreen,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          menuValue: 'Error Pages',
          icon2: 'file-x',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: '404 Error',
              route: routes.error404,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: '500 Error',
              route: routes.error500,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
        {
          menuValue: 'Blank Page',
          icon2: 'file',
          route: routes.blankPage,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Pricing',
          icon2: 'currency-dollar',
          route: routes.pricing     ,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Coming Soon',
          icon2: 'send',
          route: routes.comingSoon,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Under Maintenance',
          icon2: 'alert-triangle',
          route: routes.underMaintanance,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
    {
      tittle: 'Settings',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'General Settings',
          icon2: 'settings',
          hasSubRoute: true,
          showSubRoute: false,
          page: 'general-settings',
          subMenus: [
            {
              menuValue: 'Profile',
              route: routes.generalSettings,
              hasSubRoute: false,
              showSubRoute: false,
              page:'profile',
            },
            {
              menuValue: 'Security',
              route: routes.securitySettings,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Notifications',
              route: routes.settingsNotification,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Connected Apps',
              route: routes.connectedApps,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
        {
          menuValue: 'Website Settings',
          page: 'website-settings',
          icon2: 'globe',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'System Settings',
              route: routes.systemSettings,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Company Settings',
              route: routes.companySettings,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Localization',
              route: routes.localizationSettings,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Prefixes',
              route: routes.prefixes,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Preference',
              route: routes.preference,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Appearance',
              route: routes.appearance,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Social Authentication',
              route: routes.socialAuthentication,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Language',
              route: routes.languageSettings,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
        {
          menuValue: 'App Settings',
          page: 'app-settings',
          icon2: 'device-mobile',
          hasSubRouteTwo: true,
          showSubRoute: false,
          base: 'app-settings',
          subMenus: [
            {
              menuValue: 'Invoice',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo:[
                {
                  menuValue: 'Invoice Settings',
                  route: routes.invoiceSettings,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Invoice Template',
                  route: routes.invoiceTemplate,
                  hasSubRoute: false,
                  showSubRoute: false,
                }
              ]
            },
            {
              menuValue: 'Printer',
              route: routes.printerSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'POS',
              route: routes.posSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Signatures',
              route: routes.signatures,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Custom Fields',
              route: routes.customFields,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          menuValue: 'System Settings',
          page: 'system-settings',
          icon2: 'device-desktop',
          hasSubRouteTwo: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Email',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Email Settings',
                  route: routes.emailSettings,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Email Template',
                  route:routes.emailTemplates,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ]
            },
            {
              menuValue: 'SMS Gateways',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'SMS Settings',
                  route: routes.smsGateway,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'SMS Template',
                  route:routes.smsTemplates,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ]
            },
            {
              menuValue: 'OTP',
              route: routes.otpSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'GDPR Cookies',
              route: routes.gdprSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          menuValue: 'Financial Settings',
          page: 'financial-settings',
          icon2: 'settings-dollar',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Payment Gateway',
              route: routes.paymentGatewaySettings,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Bank Accounts',
              route: routes.bankSettingsGrid,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Tax Rates',
              route: routes.taxRates,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Currencies',
              route: routes.currencySettings,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
        {
          menuValue: 'Other Settings',
          page: 'other-settings',
          icon2: 'settings-2',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Storage',
              route: routes.storageSettings,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Ban IP Address',
              route: routes.banIpAddress,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
        {
          menuValue: 'Logout',
          icon2: 'logout',
          route: routes.signIn,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
    {
      tittle: 'UI Interface',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Base UI',
          base: 'base-ui',
          icon2: 'vector-bezier',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Alerts',
              route: routes.uiAlerts,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Accordion',
              route: routes.uiAccordion,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Avatar',
              route: routes.uiAvatar,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Badges',
              route: routes.uiBadges,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Border',
              route: routes.uiBorders,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Buttons',
              route: routes.uiButtons,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Button Group',
              route: routes.uiButtonsGroup,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Breadcrumb',
              route: routes.uiBreadcrumb,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Card',
              route: routes.uiCards,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Carousel',
              route: routes.uiCarousel,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Colors',
              route: routes.uiColors,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Dropdowns',
              route: routes.uiDropdowns,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Grid',
              route: routes.uiGrid,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Images',
              route: routes.uiImages,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Lightbox',
              route: routes.uiLightbox,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Media',
              route: routes.uiMedia,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Modals',
              route: routes.uiModals,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Offcanvas',
              route: routes.uiOffcanvas,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Pagination',
              route: routes.uiPagination,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Popovers',
              route: routes.uiPopovers,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Progress',
              route: routes.uiProgress,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Placeholders',
              route: routes.uiPlaceholders,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Range Slider',
              route: routes.uiRangeSlider,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Spinner',
              route: routes.uiSpinner,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Sweet Alerts',
              route: routes.uiSweetAlerts,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Tabs',
              route: routes.uiNavTabs,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Toasts',
              route: routes.uiToasts,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Tooltips',
              route: routes.uiTooltips,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Typography',
              route: routes.uiTypography,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Video',
              route: routes.uiVideo,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Sortable',
              route: routes.uiSortable,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
        {
          menuValue: 'Advanced UI',
          base: 'advanced-ui',
          icon: 'layers',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Ribbon',
              route: routes.ribbon,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Clipboard',
              route: routes.clipboard,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Drag & Drop',
              route: routes.dragDrop,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Rating',
              route: routes.rating,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Text Editor',
              route: routes.textEditor,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Counter',
              route: routes.counter,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Scrollbar',
              route: routes.scrollbar,
              hasSubRoute: false,
              showSubRoute: false,
            },

            {
              menuValue: 'Timeline',
              route: routes.timeline,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
        {
          menuValue: 'Charts',
          icon2: 'chart-infographic',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'charts',
          subMenus: [
            {
              menuValue: 'Apex Charts',
              route: routes.chartApex,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Prime NG Charts',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.chartPrime,
              subRoutes: [],
            },
          ],
        },
        {
          menuValue: 'Icons',
          icon2: 'icons',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'icons',
          subMenus: [
            {
              menuValue: 'Fontawesome Icons',
              route: routes.iconFontAwesome,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Feather Icons',
              route: routes.iconFeather,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Ionic Icons',
              route: routes.iconIonic,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Material Icons',
              route: routes.iconMaterial,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Pe7 Icons',
              route: routes.iconPe7,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Simpleline Icons',
              route: routes.iconSimpleline,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Themify Icons',
              route: routes.iconThemify,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Weather Icons',
              route: routes.iconWeather,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Typicon Icons',
              route: routes.iconTypicon,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Flag Icons',
              route: routes.iconFlag,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Tabler Icons',
              route: routes.tabler,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Bootstrap Icons',
              route: routes.bootstrap,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Remix Icons',
              route: routes.remix,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
        {
          menuValue: 'Forms',
          icon2: 'input-search',
          base: 'forms',
          hasSubRouteTwo: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Form Elements',
              page1: 'form-basic-inputs',
              page2: 'form-checkbox-radios',
              page3: 'form-input-groups',
              page4: 'form-grid-gutters',
              page5: 'form-select',
              page6: 'form-mask',
              page7: 'form-fileupload',
              page8: 'form-elements',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Basic Inputs',
                  route: routes.formBasicInputs,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Checkbox & Radios',
                  route: routes.formCheckboxRadios,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Input Groups',
                  route: routes.formInputsGroups,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Grid & Gutters',
                  route: routes.formGridGutters,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Form Select',
                  route: routes.formSelect,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Input Masks',
                  route: routes.formMask,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'File Uploads',
                  route: routes.formFileUpload,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              menuValue: 'Layouts',
              customSubmenuTwo: true,
              page1: 'form-horizontal',
              page2: 'form-vertical',
              page3: 'form-floating-labels',
              hasSubRoute: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Horizontal Form',
                  route: routes.formHorizontal,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Vertical Form',
                  route: routes.formVertical,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Floating Labels',
                  route: routes.formFloatingLabels,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              menuValue: 'Form Validation',
              route: routes.formValidation,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Select2',
              route: routes.formSelect2,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Form Wizard',
              route: routes.formWizard,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Form Picker',
              route: routes.formPickers,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          menuValue: 'Tables',
          icon2: 'table',
          base: 'table',
          hasSubRoute: true,
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Basic Tables',
              route: routes.basicTable,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              menuValue: 'Data Table',
              route: routes.dataTable,
              hasSubRoute: false,
              showSubRoute: false,
            },
          ],
        },
        {
          menuValue: 'Maps',
          hasSubRoute: true,
          showSubRoute: false,
          icon2: 'map-pin-pin',
          base: 'maps',
          materialicons: 'people',
          subMenus: [
            {
              menuValue: 'Leaflets',
              route: routes.leaflet,
              base: 'leaflets',
            },

          ],
        },
      ],
    },
    {
      tittle: 'Help',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Documentation',
          icon2: 'file-text',
          // route: routes.chat,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Changelog',
          icon2: 'exchange ',
          // route: routes.chat,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Multi Level',
          hasSubRouteThree: true,
          icon2: 'menu-2',
          showSubRoute: false,
          subMenus: [
            {
              menuValue: 'Level 1.1',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuThree: false,
            },
            {
              menuValue: 'Level 1.2',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuThree: true,
              subMenusTwo: [
                {
                  menuValue: 'Level 2.1',
                  hasSubRoute: false,
                  showSubRoute: false,
                  customSubmenuFour: false,
                },
                {
                  menuValue: 'Level 2.2',
                  hasSubRoute: false,
                  showSubRoute: false,
                  customSubmenuFour: true,
                  subMenusThree: [
                    {
                      menuValue: 'Level 3.1',
                      hasSubRoute: false,
                      showSubRoute: false,
                      customSubmenuFour: true,
                    },
                    {
                      menuValue: 'Level 3.2',
                      hasSubRoute: false,
                      showSubRoute: false,
                      customSubmenuFour: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  public sidebarData2:SideBar[] = [
    {
      tittle: 'Main',
      icon: 'airplay',
      showAsTab: true,
      showMyTab:true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Dashboard',
          route: routes.index,
          hasSubRoute: true,
          showSubRoute: false,
          icon: 'smart-home',
          base: 'dashboard',
          materialicons: 'home',
          subMenus: [
            {
              menuValue: 'Admin Dashboard',
              route: routes.index,
              base: 'index',
            },
            {
              menuValue: 'Admin Dashboard 2',
              route: routes.adminDashboard,
              base: 'admin-dashboard',
            },
            {
              menuValue: 'Sales Dashboard',
              route: routes.salesDashboard,
              base: 'sales-dashboard',
            },
          ],
        },
        {
          menuValue: 'Super Admin',
          hasSubRoute: true,
          showSubRoute: false,
          icon: 'user-star',
          base: 'super-admin',
          materialicons: 'home',
          subMenus: [
            {
              menuValue: 'Dashboard',
              route: routes.superadminDashboard,
              base: 'dashboard',
            },
            {
              menuValue: 'Companies',
              route: routes.superadminCompanies,
              base: 'companies',
            },
            {
              menuValue: 'Subscriptions',
              route: routes.superadminSubscriptions,
              base: 'subscriptions',
            },
            {
              menuValue: 'Packages',
              route: routes.superadminPackages,
              base: 'packages',
            },
            {
              menuValue: 'Domain',
              route: routes.superadminDomain,
              base: 'domain',
            },
            {
              menuValue: 'Purchase Transaction',
              route: routes.purchaseTransaction,
              base: 'purchase-transaction',
            },
          ],
        },
        {
          menuValue: 'Application',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'layout-grid-add',
          base: 'application',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Chat',
              route: routes.chat,
              base:'chat',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Calls',
              customSubmenuTwo: true,
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.calendar,
              base: 'call',
              subMenusTwo: [
                {
                  menuValue: 'Video Call',
                  route: routes.videoCall,
                  hasSubRoute: false,
                  showSubRoute: false,
                  base: '/application/video-call',
                },
                {
                  menuValue: 'Audio Call',
                  route: routes.audioCall,
                  hasSubRoute: false,
                  showSubRoute: false,
                  base: '/application/audio-call',
                },
                {
                  menuValue: 'Call History',
                  route: routes.callHistory,
                  hasSubRoute: false,
                  showSubRoute: false,
                  base: '/application/call-history',
                },
              ],
            },
            {
              menuValue: 'Calendar',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.calendar,
              customSubmenuTwo: false,
              base:'calendar'
            },

            {
              menuValue: 'Email',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.email,
              customSubmenuTwo: false,
              base:'email'
            },
            {
              menuValue: 'To Do',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.toDo,
              customSubmenuTwo: false,
              base:'todo'
            },
            {
              menuValue: 'Notes',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.notes,
              customSubmenuTwo: false,
              base:'notes'
            },
            {
              menuValue: 'File Manager',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.fileManager,
              customSubmenuTwo: false,
              base:'file-manager'
            },
            {
              menuValue: 'Projects',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.kanban,
              customSubmenuTwo: false,
              base:'projects'
            },
            {
              menuValue: 'Ecommerce',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.invoice,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Products',
                  route: routes.products,
                  hasSubRoute: false,
                  showSubRoute: false,
                  base: 'products',
                },
                {
                  menuValue: 'Orders',
                  route: routes.orders,
                  hasSubRoute: false,
                  showSubRoute: false,
                  base: 'orders',
                },
                {
                  menuValue: 'Customers',
                  route: routes.ecommerceCustomers,
                  hasSubRoute: false,
                  showSubRoute: false,
                  base: 'customers',
                },
                {
                  menuValue: 'Cart',
                  route: routes.cart,
                  hasSubRoute: false,
                  showSubRoute: false,
                  base: 'cart',
                },
                {
                  menuValue: 'Checkout',
                  route: routes.checkout,
                  hasSubRoute: false,
                  showSubRoute: false,
                  base: 'checkout',
                },
                {
                  menuValue: 'Wishlist',
                  route:routes.wishlist,
                  hasSubRoute: false,
                  showSubRoute: false,
                  base: 'wishlist',
                },
                {
                  menuValue: 'Reviews',
                  route: routes.reviews,
                  hasSubRoute: false,
                  showSubRoute: false,
                  base: 'reviews',
                },
              ],
            },
          ],
        },
       
      ],
    },
    {
      tittle: 'Layout',
      icon: 'file',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Layouts',
          hasSubRoute: true,
          showSubRoute: false,
          icon: 'layout-board-split',
          base: 'layout-horizontal',
          base2: 'layout-two-column',
          materialicons: 'home',
          subMenus: [
            {
              menuValue: 'Horizontal',
              route: routes.Horizontal,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'layout-horizontal',
            },
            {
              menuValue: 'Detached',
              route: routes.Detached,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'crm',
            },
            {
              menuValue: 'Two Column',
              route: routes.TwoColumn,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'layout-two-column',
            },
            {
              menuValue: 'Boxed',
              route: routes.Boxed,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'crm',
            },
            {
              menuValue: 'RTL',
              route: routes.RTL,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'crm',
            },
            {
              menuValue: 'Dark',
              route: routes.Dark,
              hasSubRoute: false,
              showSubRoute: false,
              base: 'crm',
            },
          ],
        },
      ],
    },
    {
      tittle: 'Inventory',
      icon: 'layers',
      showAsTab: false,
      separateRoute: false,
      base: 'projects',
      menu: [
        {
          menuValue: 'Inventory',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'table-plus',
          base: 'product-list',
          base2:'add-product',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Products',
              route: routes.productList,
              base: 'product-list',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Create Product',
              route: routes.addProduct,
              base: 'add-product',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Expired Products',
              route: routes.expiredProduct,
              base: 'expired-products',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Low Stocks',
              route: routes.lowStock,
              base: 'low-stocks',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Category',
              route: routes.categoryList,
              page: 'category-list',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Sub Category',
              route: routes.subCategories,
              page:'sub-categories',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Brands',
              route: routes.brandList,
              base: 'brand-list',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Units',
              route: routes.units,
              base: 'units',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Variant Attributes',
              route: routes.varriantAttributes,
              base: 'client',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Warranties',
              route: routes.warranty,
              base: 'warranty',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Print Barcode',
              route: routes.barCode,
              base: 'barcode',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Print QR Code',
              route: routes.qrCode,
              base: 'qrcode',
              customSubmenuTwo: false,
            },
          ],
        },
      ],
    },
    {
      tittle: 'Stock',
      icon: 'layers',
      showAsTab: false,
      separateRoute: false,
      base: 'projects',
      menu: [
        {
          menuValue: 'Stock',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'stack-3',
          base: 'inventory',
          base2:'projects',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Manage Stock',
              route: routes.manageStocks,
              base: 'manage-stocks',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Stock Adjustment',
              route: routes.stockAdjustment,
              base: 'stock-adjustment',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Stock Transfer',
              route: routes.stockTransfer,
              base: 'stock-transfer',
              customSubmenuTwo: false,
            },
          ],
        },
      ],
    },
    {
      tittle: 'Sales',
      icon: 'file',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Sales',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'device-laptop',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Sales',
              hasSubRoute: true,
              customSubmenuTwo: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Online Orders',
                  route: routes.salesList,
                  base: 'online-order',
                },
                {
                  menuValue: 'POS Orders',
                  route: routes.PosOrder,
                  base: 'pos-order',
                },
              ],
            },
            {
              menuValue: 'Invoices',
              route: routes.invoice,
              base: 'invoice',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Sales Return',
              route: routes.salesReturn,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
              base: 'sales-return',
            },
            {
              menuValue: 'Quotation',
              route: routes.quotationList,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
              base: 'quotation-list',
            },
            
            {
              menuValue: 'POS',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              base: 'trainings',
              subMenusTwo: [
                {
                  menuValue: 'pos 1',
                  route: routes.pos,
                  base: 'training-list',
                },
                {
                  menuValue: 'Pos 2',
                  route: routes.pos2,
                  base: 'trainers',
                },
                {
                  menuValue: 'Pos 3',
                  route: routes.pos3,
                  base: 'types',
                },
                {
                  menuValue: 'Pos 4',
                  route: routes.pos4,
                  base: 'types',
                },
                {
                  menuValue: 'Pos 5',
                  route: routes.pos5,
                  base: 'types',
                },
              ],
            },
          ],
        },
      ],
    },

    {
      tittle: 'Finance & Accounts',
      icon: 'file',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Finance & Accounts',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'shopping-cart-dollar',
          base: 'sales',
          base2:'accounting',
          base3:'payroll',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Coupons',
              route: routes.coupons,
              base: 'coupons',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Gift Cards',
              route: routes.giftCards,
              base: 'gift-cards',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Discount',
              hasSubRoute: true,
              customSubmenuTwo: true,
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Discount Plan',
                  route: routes.discountPlan,
                  base: 'discount-plan',
                },
                {
                  menuValue: 'Discount',
                   route: routes.discount,
                  base: 'discount',
                },
              ],
            },
            {
              menuValue: 'Purchases',
              route: routes.purchaseList,
              base: 'purchase-list',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Purchase Order',
              route: routes.purchaseOrderReport,
              base: 'purchase-order-report',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Purchase Return',
              route: routes.purchaseReturns,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
              base: 'purchase-order-report',
            },
            {
              menuValue: 'Expenses',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Expenses',
                  route: routes.expenseList,
                  base: 'expense-list',
                },
                {
                  menuValue: 'Expense Category',
                  route: routes.expenseCategory,
                  base: 'expense-category',
                },
                
              ],
            },
            {
              menuValue: 'Income',
              base: 'income',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Income',
                  route: routes.income,
                  base: 'income',
                },
                {
                  menuValue: 'Income Category',
                  route: routes.incomeCategory,
                  base: 'income-category',
                },
                
              ],
            },
            {
              menuValue: 'Balance Sheet',
              base: 'balance-sheet',
              route:routes.balanceSheet,
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Trail Balance',
              base: 'trial-balance',
              route:routes.trailBalance,
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Cash Flow',
              base: 'cash-flow',
              route:routes.cashFlow,
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Account Statement',
              base: 'account-statement',
              route:routes.accountStatement,
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: false,
            },

          ],
        },
      ],
    },
    {
      tittle: 'Hrm',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Hrm',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'cash',
          base: 'assets',
          base2:'support',
          base3:'user-management',
          base4:'reports',
          base5:'settings',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Employees',
              base: 'employee-grid',
              route: routes.employeesGrid,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Departments',
              base: 'department-grid',
              route: routes.departmentGrid,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Designation',
              base: 'designation',
              route: routes.designation,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Shifts',
              base: 'shift',
              route: routes.shift,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Attendance',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Employee',
                  route: routes.attendanceEmployee,
                  base: 'attendance-employee',
                },
                {
                  menuValue: 'Admin',
                  route: routes.attendanceAdmin,
                  base: 'attendance-admin',
                },
                
              ],

            },
            {
              menuValue: 'Leaves',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Admin Leaves',
                  route: routes.leavesAdmin,
                  base: 'leaves-admin',
                },
                {
                  menuValue: 'Employee Leaves',
                  route: routes.leavesEmployee,
                  base: 'leaves-employee',
                },
                {
                  menuValue: 'Leave Type',
                  route: routes.leavesType,
                  base: 'leave-type',
                },
                
              ],

            },
            {
              menuValue: 'Holidays',
              base: 'holidays',
              route: routes.holidays,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Payroll',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Employee Salary',
                  route: routes.payrollList,
                  base: 'employee-salary',
                },
                {
                  menuValue: 'Payslip',
                  route: routes.paySlip,
                  base: 'payslip',
                },
                
              ],

            },
          ],
        },
      ],
    },
    {
      tittle: 'Reports',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Reports',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'license',
          base: 'apps',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Sales Report',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Sales Report',
                  route: routes.salesReport,
                  base: 'sales-report',
                },
                {
                  menuValue: 'Best Seller',
                  route: routes.bestSeller,
                  base: 'best-seller',
                },
              ]
            },
            {
              menuValue: 'Purchase Report',
              route: routes.purchaseReport,
              base: 'purchase-report',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Inventary Report',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Inventary Report',
                  route: routes.inventoryReport,
                  base: 'inventory-report',
                },
                {
                  menuValue: 'Stock History',
                  route: routes.stockHistory,
                  base: 'stock-history',
                },
                {
                  menuValue: 'Sold Stock',
                  route: routes.soldStock,
                  base: 'sold-stock',
                },
              ]
            },
            
            {
              menuValue: 'Invoice Report',
              route: routes.invoiceReport,
              base: 'invoice-report',
            },
            {
              menuValue: 'Supplier Report',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Supplier Report',
                  route: routes.supplierReport,
                  base: 'supplier-report',
                },
                {
                  menuValue: 'Supplier Due Report',
                  route: routes.supplierDueReport,
                  base: 'supplier-due-report',
                },
              ]
            },
            {
              menuValue: 'Customer Report',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'customer Report',
                  route: routes.customerReport,
                  base: 'customer-report',
                },
                {
                  menuValue: 'Customer Due Report',
                  route: routes.customerDueReport,
                  base: 'customer-due-report',
                },
              ]
            },
            {
              menuValue: 'Product Report',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Product Report',
                  route: routes.customerReport,
                  base: 'customer-report',
                },
                {
                  menuValue: 'Product Expiry Report',
                  route: routes.productExpiryReport,
                  base: 'customer-due-report',
                },
                {
                  menuValue: 'Product Quantity Alert',
                  route: routes.productQuantityAlert,
                  base: 'customer-due-report',
                },
              ]
            },
            {
              menuValue: 'Expense Report',
              route: routes.expenseReport,
              base: 'expense-report',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Income Report',
              route: routes.incomeReport,
              base: 'income-report',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Tax Report',
              route: routes.taxReport,
              base: 'tax-report',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Profit & Loss',
              route: routes.profitAndLoss,
              base: 'profit-and-loss',
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Annual Report',
              route: routes.annualReport,
              base: 'annual-report',
              customSubmenuTwo: false,
            },
            
          ],
        },
      ],
    },
    {
      tittle: 'Pages',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Pages',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'page-break',
          base: 'starter',
          base2: 'profile',
          base3: 'gallery',
          base4: 'search-result',
          base5: 'timeline',
          base7: 'pricing',
          base8: 'api-keys',
          base9: 'privacy-policy',
          base10: 'terms-condition',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Pages',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'pages',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.page
                },
               
              ]
            },
            {
              menuValue: 'Blog',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'All Blog',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.allBlog
                },
                {
                  menuValue: 'Blog Tags',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.blogTag
                },
                {
                  menuValue: 'Categories',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.categories
                },
                {
                  menuValue: 'Blog Comments',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.blogComments
                },
              ]
            },
            {
              menuValue: 'Location',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Countries',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.countries
                },
                {
                  menuValue: 'States',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.states
                },
                {
                  menuValue: 'Cities',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.cities
                },
              ]
            },
            {
              menuValue: 'Testimonial',
              route: routes.testimonial,
              base: 'testimonial',
              customSubmenuTwo:false,

            },
            {
              menuValue: 'Faq',
              route: routes.faq,
              base: 'faq',
              customSubmenuTwo:false,

            },
            {
              menuValue: 'Users',
              route: routes.users,
              base: 'user',
              customSubmenuTwo:false,

            },
            {
              menuValue: 'Roles & Permissions',
              route: routes.rolesPermission,
              base: 'delete-account',
              customSubmenuTwo:false,

            },
            {
              menuValue: 'Delete Account Request',
              route: routes.deleteaccount,
              base: 'delete-account',
              customSubmenuTwo:false,

            },
            {
              menuValue: 'Profile',
              route: routes.profile,
              base: 'profile',
              customSubmenuTwo:false,

            },
            {
              menuValue: 'Authentication',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Login',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.signIn
                },
                {
                  menuValue: 'Register',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.register
                },
                {
                  menuValue: 'Forgot Password',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.forgotPassword
                },
                {
                  menuValue: 'Reset Password',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.resetPassword
                },
                {
                  menuValue: 'Email Verification',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.emailVerification
                },
                {
                  menuValue: '2 Step Verification',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.twoStepVerification
                },
                {
                  menuValue: 'Lock Screen',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.signIn
                },
              ]
            },
            {
              menuValue: 'Error Pages',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Error 404',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.error404
                },
                {
                  menuValue: 'Error 500',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route:routes.error500
                },
              ]
            },
            {
              menuValue: 'Blank Page',
              route: routes.blankPage,
              base: 'blank-page',
              customSubmenuTwo:false,

            },
            
            {
              menuValue: 'Pricing',
              route: routes.pricing,
              base: 'pricing',
              customSubmenuTwo:false,

            },
            {
              menuValue: 'Coming Soon',
              route: routes.comingSoon,
              base: 'coming-soon',
              customSubmenuTwo:false,
            },
            {
              menuValue: 'Under Maintenance',
              route: routes.underMaintanance,
              base: 'under-maintenance',
              customSubmenuTwo:false,
            },
          ],
        },
      ],
    },

    {
      tittle: 'Settings',
      icon: 'file',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
        menuValue: 'Settings',
          route: '',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'lock-check',
          base: 'base-ui',
          base2:'advanced-ui',
          base3:'charts',
          base4:'icon',
          base5:'forms',
          base7:'table',
          materialicons: 'dashboard',
          subMenus:[
            {
              menuValue: 'General Settings',
              customSubmenuTwo: true,
              base: 'general-settings',
              subMenusTwo: [
                {
                  menuValue: 'Profile',
                  route: routes.generalSettings,
                  base: 'profile-settings',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Security',
                  route: routes.securitySettings,
                  base: 'security-settings',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Notifications',
                  route: routes.settingsNotification,
                  base: 'notification-settings',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Connected Apps',
                  route: routes.connectedApps,
                  base: 'connected-apps',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              menuValue: 'Website Settings',
              customSubmenuTwo: true,
              base: 'website-settings',
              subMenusTwo: [
                {
                  menuValue: 'System Settings',
                  route: routes.systemSettings,
                  base: 'bussiness-settings',
                },
                {
                  menuValue: 'Company Settings',
                  route: routes.companySettings,
                  base: 'seo-settings',
                },
                {
                  menuValue: 'Localization',
                  route: routes.localizationSettings,
                  base: 'localization-settings',
                },
                {
                  menuValue: 'Prefixes',
                  route: routes.prefixes,
                  base: 'prefixes',
                },
                {
                  menuValue: 'Preferences',
                  route: routes.preference,
                  base: 'preferences',
                },
                {
                  menuValue: 'Appearance',
                  route: routes.appearance,
                  base: 'appearance',
                },
                {
                  menuValue: 'Language',
                  route: routes.languageSettings,
                  base: 'language',
                  base2: 'add-language',
                },
                {
                  menuValue: 'Social Authentication',
                  route: routes.socialAuthentication,
                  base: 'authentication-settings',
                },
              ],
            },
            {
              menuValue: 'App Settings',
              customSubmenuTwo: true,
              base: 'app-settings',
              subMenusTwo: [
                {
                  menuValue: 'Invoice Settings',
                  route: routes.invoiceSettings,
                  base: 'invoice-settings',
                },
                {
                  menuValue: 'Invoice Template',
                  route: routes.invoiceTemplate,
                  base: 'invoice-settings',
                },
                {
                  menuValue: 'Printer',
                  route: routes.printerSettings,
                  base: 'salary-settings',
                },
                {
                  menuValue: 'POS',
                  route: routes.posSettings,
                  base: 'pos-settings',
                },
                
                {
                  menuValue: 'Signatures',
                  route: routes.signatures,
                  base: 'signatures',
                },
                {
                  menuValue: 'Custom Fields',
                  route: routes.customFields,
                  base: 'custom-fields',
                },
              ],
            },
            {
              menuValue: 'System Settings',
              customSubmenuTwo: true,
              base: 'system-settings',
              subMenusTwo: [
                {
                  menuValue: 'Email Settings',
                  route: routes.emailSettings,
                  base: 'email-settings',
                },
                {
                  menuValue: 'Email Templates',
                  route: routes.emailTemplates,
                  base: 'email-template',
                },
                {
                  menuValue: 'SMS Settings',
                  route: routes.smsGateway,
                  base: 'sms-settings',
                },
                {
                  menuValue: 'SMS Templates',
                  route: routes.smsTemplates,
                  base: 'sms-template',
                },
                {
                  menuValue: 'OTP',
                  route: routes.otpSettings,
                  base: 'otp-settings',
                },
                {
                  menuValue: 'GDPR Cookies',
                  route: routes.gdprSettings,
                  base: 'gdpr',
                },
              ],
            },
            {
              menuValue: 'Financial Settings',
              customSubmenuTwo: true,
              base: 'financial-settings',
              subMenusTwo: [
                {
                  menuValue: 'Payment Gateways',
                  route: routes.paymentGatewaySettings,
                  base: 'payment-gateways',
                },
                {
                  menuValue: 'Bank Accounts',
                  route: routes.bankSettingsGrid,
                  base: 'bank-acoounts',
                },
                {
                  menuValue: 'Tax Rate',
                  route: routes.taxRates,
                  base: 'tax-rates',
                },
                {
                  menuValue: 'Currencies',
                  route: routes.currencySettings,
                  base: 'currencies',
                },
              ],
            },
            {
              menuValue: 'Other Settings',
              customSubmenuTwo: true,
              base: 'other-settings',
              subMenusTwo: [
                {
                  menuValue: 'Storage',
                  route: routes.storageSettings,
                  base: 'custom-css',
                },
                {
                  menuValue: 'Ban IP Address',
                  route: routes.banIpAddress,
                  base: 'custom-js',
                },
              ],
            },
            {
              menuValue: 'Logout',
              customSubmenuTwo: false,
              base: 'logout',
              route:routes.signIn
            }
          ]
        }
      ]
    },
    {
      tittle: 'UI Interface',
      icon: 'file',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'UI Interface',
          route: '',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'ux-circle',
          base: 'base-ui',
          base2:'advanced-ui',
          base3:'charts',
          base4:'icon',
          base5:'forms',
          base7:'table',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Base UI',
              route: routes.index,
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              base: 'base-ui',
              subMenusTwo: [
                {
                  menuValue: 'Alerts',
                  route: routes.uiAlerts,
                  base: 'ui-alerts',
                },
                {
                  menuValue: 'Accordions',
                  route: routes.uiAccordion,
                  base: 'ui-accordion',
                },
                {
                  menuValue: 'Avatar',
                  route: routes.uiAvatar,
                  base: 'ui-avatar',
                },
                {
                  menuValue: 'Badges',
                  route: routes.uiBadges,
                  base: 'ui-badges',
                },
                {
                  menuValue: 'Border',
                  route: routes.uiBorders,
                  base: 'ui-badges',
                },
                {
                  menuValue: 'Buttons',
                  route: routes.uiButtons,
                  base: 'ui-buttons',
                },
                {
                  menuValue: 'Button Group',
                  route: routes.uiButtonsGroup,
                  base: 'ui-buttons-group',
                },
                {
                  menuValue: 'Breadcrumb',
                  route: routes.uiBreadcrumb,
                  base: 'ui-breadcrumb',
                },
                {
                   menuValue: 'Cards', 
                  route: routes.uiCards, 
                  base: 'ui-cards' 
                },
                {
                  menuValue: 'Carousel',
                  route: routes.uiCarousel,
                  base: 'ui-carousel',
                },
                {
                  menuValue: 'Colors',
                  route: routes.uiColors,
                  base: 'ui-carousel',
                },
                {
                  menuValue: 'Dropdowns',
                  route: routes.uiDropdowns,
                  base: 'ui-dropdowns',
                },
                { 
                  menuValue: 'Grid', 
                  route: routes.uiGrid, 
                  base: 'ui-grid' 
                },
                {
                  menuValue: 'Images',
                  route: routes.uiImages,
                  base: 'ui-images',
                },
                {
                  menuValue: 'Lightbox',
                  route: routes.uiLightbox,
                  base: 'ui-lightbox',
                },
                { 
                  menuValue: 'Media',
                   route: routes.uiMedia,
                    base: 'ui-media'
                   },
                { 
                  menuValue: 'Modals',
                   route: routes.uiModals,
                    base: 'ui-modals' 
                  },
                {
                  menuValue: 'Offcanvas',
                  route: routes.uiOffcanvas,
                  base: 'ui-offcanvas',
                },
                {
                  menuValue: 'Pagination',
                  route: routes.uiPagination,
                  base: 'ui-pagination',
                },
                {
                  menuValue: 'Popovers',
                  route: routes.uiPopovers,
                  base: 'ui-pagination',
                },

                {
                  menuValue: 'Progress',
                  route: routes.uiProgress,
                  base: 'ui-progress',
                },
                {
                  menuValue: 'Placeholders',
                  route: routes.uiPlaceholders,
                  base: 'ui-placeholders',
                },
                {
                  menuValue: 'Range Slider',
                  route: routes.uiRangeSlider,
                  base: 'ui-rangeslider',
                },
                {
                  menuValue: 'Spinner',
                  route: routes.uiSpinner,
                  base: 'ui-spinner',
                },
                {
                  menuValue: 'Sweet Alerts',
                  route: routes.uiSweetAlerts,
                  base: 'ui-sweet-alerts',
                },
                {
                  menuValue: 'Tabs',
                  route: routes.uiNavTabs,
                  base: 'ui-tabs',
                },
                

                {
                  menuValue: 'Toasts',
                  route: routes.uiToasts,
                  base: 'ui-toasts',
                },
                {
                  menuValue: 'Tooltip',
                  route: routes.uiTooltips,
                  base: 'ui-tooltips',
                },
                {
                  menuValue: 'Typography',
                  route: routes.uiTypography,
                  base: 'ui-typography',
                },
                {
                   menuValue: 'Videos',
                    route: routes.uiVideo,
                     base: 'ui-video'
                },
                {
                   menuValue: 'Sortable',
                    route: routes.uiSortable,
                     base: 'ui-sortable'
                },
              ],
            },
            {
              menuValue: 'Advanced Ui',
              hasSubRoute: true,
              showSubRoute: false,
              base: 'advanced-ui',
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Ribbon',
                  route: routes.ribbon,
                  base: 'ui-ribbon',
                },
                {
                  menuValue: 'Clipboard',
                  route: routes.clipboard,
                  base: 'ui-clipboard',
                },
                {
                  menuValue: 'Drag & Drop',
                  route: routes.dragDrop,
                  base: 'ui-drag-drop',
                },
                {
                  menuValue: 'Rating',
                  route: routes.rating,
                  base: 'ui-rating',
                },
                {
                  menuValue: 'Text Editor',
                  route: routes.textEditor,
                  base: 'ui-text-editor',
                },
                {
                  menuValue: 'Counter',
                  route: routes.counter,
                  base: 'ui-counter',
                },
                {
                  menuValue: 'Scrollbar',
                  route: routes.scrollbar,
                  base: 'ui-scrollbar',
                },
                {
                  menuValue: 'Timeline',
                  route: routes.timeline,
                  base: 'ui-timeline',
                },
              ],
            },
            {
              menuValue: 'Charts',
              hasSubRoute: true,
              showSubRoute: false,
              base: 'charts',
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  menuValue: 'Apex Charts',
                  route: routes.chartApex,
                  base: 'apex-charts',
                },
                {
                  menuValue: 'Prime NG Charts',
                  route: routes.chartPrime,
                  base: 'prime-ng',
                },
              ],
            },
            {
              menuValue: 'Icons',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              base: 'icon',
              subMenusTwo: [
                {
                  menuValue: 'Fontawesome Icons',
                  route: routes.iconFontAwesome,
                  base: 'fontawesome',
                },
                {
                  menuValue: 'Feather Icons',
                  route: routes.iconFeather,
                  base: 'feather',
                },
                {
                  menuValue: 'Ionic Icons',
                  route: routes.iconIonic,
                  base: 'ionic',
                },
                {
                  menuValue: 'Material Icons',
                  route: routes.iconMaterial,
                  base: 'material',
                },
                { menuValue: 'pe7 Icons', route: routes.iconPe7, base: 'pe7' },
                {
                  menuValue: 'Simpleline Icons',
                  route: routes.iconSimpleline,
                  base: 'simple-line',
                },
                {
                  menuValue: 'Themify Icons',
                  route: routes.iconThemify,
                  base: 'themify',
                },
                {
                  menuValue: 'Weather Icons',
                  route: routes.iconWeather,
                  base: 'weather',
                },
                {
                  menuValue: 'Typicon Icons',
                  route: routes.iconTypicon,
                  base: 'typicon',
                },
                { menuValue: 'Flag Icons', route: routes.iconFlag, base: 'flag' },
                {
                  menuValue: 'Tabler Icons',
                  route: routes.tabler,
                  base: 'tabler',
                },
                {
                  menuValue: 'Bootstrap Icons',
                  route: routes.bootstrap,
                  base: 'tabler',
                },
                {
                  menuValue: 'Remix Icons',
                  route: routes.remix,
                  base: 'tabler',
                },
              ],
            },
            {
              menuValue: 'Forms',
              customSubmenuTwo: true,
              base: 'forms',
              showSubRoute: false,
              subMenusTwo: [
                {
                  menuValue: 'Basic Inputs',
                  route: routes.formBasicInputs,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Checkbox & Radios',
                  route: routes.formCheckboxRadios,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Input Groups',
                  route: routes.formInputsGroups,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Grid & Gutters',
                  route: routes.formGridGutters,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Form Select',
                  route: routes.formSelect,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Input Masks',
                  route: routes.formMask,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'File Uploads',
                  route: routes.formFileUpload,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Horizontal Form',
                  route: routes.formHorizontal,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Vertical Form',
                  route: routes.formVertical,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  menuValue: 'Floating Labels',
                  route: routes.formFloatingLabels,
                  hasSubRoute: false,
                  showSubRoute: false,
                },

                {
                  menuValue: 'Form Validation',
                  route: routes.formValidation,
                  hasSubRoute: false,
                  showSubRoute: false,
                  customSubmenuTwo: false,
                },
              ],
            },
            {
              menuValue: 'Tables',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              base: 'tables',
              subMenusTwo: [
                {
                  menuValue: 'Basic Tables',
                  route: routes.basicTable,
                  base: 'tables-basic',
                },
                {
                  menuValue: 'Data Tables',
                  route: routes.dataTable,
                  base: 'data-basic',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      tittle: 'Extras',
      icon: 'file',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Extras',
          route: '',
          hasSubRouteTwo: true,
          showSubRoute: false,
          icon: 'vector-triangle',
          base: 'apps',
          materialicons: 'dashboard',
          subMenus: [
            {
              menuValue: 'Documentation',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
              base: '1',
            },
            {
              menuValue: 'Change Log',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
              base: '1',
            },
            {
              menuValue: 'Multi Level',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              base: '1',
              subMenusTwo: [
                {
                  menuValue: 'Level 1.1',
                  route: routes.basicTable,
                  base: 'tables-basic',
                },
                {
                  menuValue: 'Level 1.2',
                  route: routes.dataTable,
                  base: 'data-basic',
                },
              ],
            },
          ],
        },
      ],
    },
  ];
  public getSideBarData2: BehaviorSubject<SideBar[]> = new BehaviorSubject<
    SideBar[]
  >(this.sidebarData2);
  public resetData2(): void {
    this.sidebarData2.map((res: SideBar) => {
      res.showAsTab = false;
      res.menu.map((menus: SideBarMenu) => {
        menus.showSubRoute = false;
      });
    });
  }
  public sidebarData3 = [
    {
      tittle: 'Main Menu',
      hasSubRoute: true,
      icon: 'layout-grid',
      showSubRoute: false,
      subRoutes: [
        {
          tittle: 'Dashboard',
          hasSubRoute: true,
          showSubRoute: true,
          route: routes.dashboard,
          subRoutes: [
            {
              tittle: 'Admin Dashboard',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.index,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Admin Dashboard 2',
              hasSubRoute: false,
              showSubRoute: false,
               route: routes.adminDashboard,
               customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Sales Dashboard',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.salesDashboard,
              customSubmenuTwo: false,
              subRoutes: [],
            },
          ],
        },
        {
          tittle: 'Super Admin',
          hasSubRoute: true,
          showSubRoute: true,
          route: routes.dashboard,
          subRoutes: [
            {
              tittle: 'Dashboard',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/supeadmin',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Companies',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/admin2',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Subcriptions',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/supeadmin',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Packages',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/supeadmin',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Domain',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/supeadmin',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Purchase Transcation',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/supeadmin',
              customSubmenuTwo: false,
              subRoutes: [],
            },
          ],
        },
        {
          tittle: 'Application',
          hasSubRoute: true,
          showSubRoute: true,
          base: 'application',
          subRoutes: [
            {
              tittle: 'Chat',
              route: routes.chat,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Call',
              hasSubRoute: true,
              showSubRoute: false,
              base: 'application',
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Video Call',
                  route: routes.videoCall,
                  hasSubRoute: false,
                  showSubRoute: false,
                  subRoutes: [],
                },
                {
                  tittle: 'Audio Call',
                  route: routes.audioCall,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Call History',
                  route: routes.callHistory,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              tittle: 'Calendar',
              route: routes.calendar,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Email',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.email,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'To Do',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.toDo,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Notes',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.notes,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'File Manager',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.fileManager,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Products',
              hasSubRoute: false,
              showSubRoute: false,
              route: '/appli',
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Ecommerce',
              hasSubRoute: true,
              showSubRoute: true,
              base: 'ecommerce',
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Products',
                  route: '/ecommerce',
                  hasSubRoute: false,
                  showSubRoute: false,
                  subRoutes: [],
                },
                {
                  tittle: 'Orders',
                  route: '/orde',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                
                {
                  tittle: 'Customers',
                  route: '/ecommer',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Cart',
                  route: '/ecommer',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Checkout',
                  route: '/ecommer',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Wishlist',
                  route: '/ecommer',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Reviews',
                  route: '/ecommer',
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              tittle: 'Social Feeds',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.socialFeed,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Search List',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.kanban,
              customSubmenuTwo: false,
              subRoutes: [],
            },
          ],
        },
        {
          tittle: 'Layouts',
          hasSubRoute: true,
          showSubRoute: true,
          activeRoute: 'layot',
          subRoutes: [
            {
              tittle: 'Horizontal',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.Horizontal,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Detached',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.Detached,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Two Column',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.TwoColumn,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Boxed',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.Boxed,
              customSubmenuTwo: false,
            },
            {
              tittle: 'RTL',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.RTL,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Dark',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.Dark,
              customSubmenuTwo: false,
            },
          ],
        },
      ],
    },
    {
      tittle: 'Inventory',
      hasSubRoute: true,
      icon: 'brand-unity',
      showSubRoute: false,
      activeRoute: 'product',
      subRoutes: [
        {
          tittle: 'Products',
          hasSubRoute: false,
          showSubRoute: true,
          route: routes.productList,
          subRoutes: [],
        },
        {
          tittle: 'Create Product',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.addProduct,
          subRoutes: [],
        },
        {
          tittle: 'Expired Products',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.expiredProduct,
          subRoutes: [],
        },
        {
          tittle: 'Low Stocks',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.lowStock,
          subRoutes: [],
        },
        {
          tittle: 'Category',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.categoryList,
          subRoutes: [],
        },
        {
          tittle: 'Sub Category',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.subCategories,
          subRoutes: [],
        },
        {
          tittle: 'Brands',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.brandList,
          subRoutes: [],
        },
        {
          tittle: 'Units',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.units,
          subRoutes: [],
        },
        {
          tittle: 'Variant Attributes',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.varriantAttributes,
          subRoutes: [],
        },
        {
          tittle: 'Warranties',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.warranty,
          subRoutes: [],
        },
        {
          tittle: 'Print Barcode',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.barCode,
          subRoutes: [],
        },
        {
          tittle: 'Print QR Code',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.qrCode,
          subRoutes: [],
        },
      ],
    },
    {
      tittle: 'Sales & Purchase',
      hasSubRoute: true,
      icon: 'layout-grid',
      showSubRoute: false,
      subRoutes: [
        {
          tittle: 'Stock',
          hasSubRoute: true,
          showSubRoute: true,
          subRoutes: [
            {
              tittle: 'Manage Stock',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.manageStocks,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Stock Adjustment',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.stockAdjustment,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Stock Transfer',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.stockTransfer,
              customSubmenuTwo: false,
              subRoutes: [],
            },
          ],
        },
        {
          tittle: 'Sales',
          hasSubRoute: true,
          showSubRoute: false,
          route: routes.salesList,
          subRoutes: [
            {
              tittle: 'Sales',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.salesList,
              subRoutes: [
                {
                  tittle: 'Online Order',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.salesList,
                  customSubmenuTwo: false,
                  subRoutes: [],
                },
                {
                  tittle: 'POS Order',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.PosOrder,
                  customSubmenuTwo: false,
                  subRoutes: [],
                }
              ],
            },
            {
              tittle: 'Invoice',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.invoice,
              subRoutes: [],
            },
            {
              tittle: 'Sales Return',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.salesReturn,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Quotation',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.quotationList,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'POS',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.pos,
              subRoutes: [
                {
                  tittle: 'POS 1',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.pos,
                  customSubmenuTwo: false,
                  subRoutes: [],
                },
                {
                  tittle: 'POS 2',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.pos2,
                  customSubmenuTwo: false,
                  subRoutes: [],
                },
                {
                  tittle: 'POS 3',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.pos3,
                  customSubmenuTwo: false,
                  subRoutes: [],
                },
                {
                  tittle: 'POS 4',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.pos4,
                  customSubmenuTwo: false,
                  subRoutes: [],
                },
                {
                  tittle: 'POS 5',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.pos5,
                  customSubmenuTwo: false,
                  subRoutes: [],
                },
                
              ],
            },
          ],
        },
        {
          tittle: 'Promo',
          hasSubRoute: true,
          showSubRoute: false,
          subRoutes: [
            {
              tittle: 'Coupons',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.coupons,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Gift Cards',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.giftCards,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Discount',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Discount Plan',
                  route: routes.discountPlan,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Discount',
                  route: routes.discount,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ]
            },
          ],
        },
        {
          tittle: 'Purchases',
          hasSubRoute: true,
          icon: 'assets/img/icons/purchase1.svg',
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [
            {
              tittle: 'Purchases',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.purchaseList,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Purchase Order',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.purchaseOrderReport,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Purchase Return',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.purchaseReturns,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            
          ],
        },
        {
          tittle: 'Expenses',
          hasSubRoute: true,
          showSubRoute: true,
          route: routes.stockTransfer,
          subRoutes: [
            {
              tittle: 'Expenses',
              route: routes.expenseList,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Expense Category',
              route: routes.expenseCategory,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Income',
          hasSubRoute: true,
          showSubRoute: false,
          subRoutes: [
            {
              tittle: 'Income',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.income,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Income Category',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.incomeCategory,
              subRoutes: [],
              customSubmenuTwo: false,
            }
          ],
        },
        {
          tittle: 'Bank Accounts',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.accountList,
          subRoutes: []
        },
        {
          tittle: 'Money Transfer',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.moneyTransfer,
          subRoutes: []
        },
        {
          tittle: 'Balance Sheet',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.balanceSheet,
          subRoutes: []
        },
        {
          tittle: 'Trial Balance',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.trailBalance,
          subRoutes: []
        },
        {
          tittle: 'Cash Flow',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.cashFlow,
          subRoutes: []
        },
        {
          tittle: 'Account Statement',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.accountStatement,
          subRoutes: []
        },
      ],
    },
    {
      tittle: 'UI Interface',
      hasSubRoute: true,
      icon: 'users-group',
      showSubRoute: false,
      activeRoute: 'users',
      subRoutes: [
        {
          tittle: 'Base UI',
          hasSubRoute: true,
          icon: 'assets/img/icons/printer.svg',
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [
            {
              tittle: 'Alerts',
              route: routes.uiAlerts,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Accordion',
              route: routes.uiAccordion,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Avatar',
              route: routes.uiAvatar,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Badges',
              route: routes.uiBadges,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Border',
              route: routes.uiBorders,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Buttons',
              route: routes.uiButtons,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Button Group',
              route: routes.uiButtonsGroup,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Breadcrumb',
              route: routes.uiBreadcrumb,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Card',
              route: routes.uiCards,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Carousel',
              route: routes.uiCarousel,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Colors',
              route: routes.uiColors,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Dropdowns',
              route: routes.uiDropdowns,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Grid',
              route: routes.uiGrid,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Images',
              route: routes.uiImages,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Lightbox',
              route: routes.uiLightbox,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Media',
              route: routes.uiMedia,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Modals',
              route: routes.uiModals,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Offcanvas',
              route: routes.uiOffcanvas,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Pagination',
              route: routes.uiPagination,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Popovers',
              route: routes.uiPopovers,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Progress',
              route: routes.uiProgress,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Placeholders',
              route: routes.uiPlaceholders,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Range Slider',
              route: routes.uiRangeSlider,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Spinner',
              route: routes.uiSpinner,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Sweet Alerts',
              route: routes.uiSweetAlerts,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Tabs',
              route: routes.uiNavTabs,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Toasts',
              route: routes.uiToasts,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Tooltips',
              route: routes.uiTooltips,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Typography',
              route: routes.uiTypography,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Video',
              route: routes.uiVideo,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Sortable',
              route: routes.uiSortable,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Advanced UI',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [
            {
              tittle: 'Ribbon',
              route: routes.ribbon,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Clipboard',
              route: routes.clipboard,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Drag & Drop',
              route: routes.dragDrop,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              tittle: 'Rating',
              route: routes.rating,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              tittle: 'Text Editor',
              route: routes.textEditor,
              hasSubRoute: false,
              showSubRoute: false,
            },
            {
              tittle: 'Counter',
              route: routes.counter,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Scrollbar',
              route: routes.scrollbar,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },

            {
              tittle: 'Timeline',
              route: routes.timeline,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Charts',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [
            {
              tittle: 'Apex Charts',
              route: routes.chartApex,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Prime NG Charts',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.chartPrime,
              subRoutes: [],
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Primary-icons',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [
            {
              tittle: 'Fontawesome Icons',
              route: routes.iconFontAwesome,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Feather Icons',
              route: routes.iconFeather,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Ionic Icons',
              route: routes.iconIonic,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Material Icons',
              route: routes.iconMaterial,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Pe7 Icons',
              route: routes.iconPe7,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Secondary-icons',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [
            {
              tittle: 'Simpleline Icons',
              route: routes.iconSimpleline,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Themify Icons',
              route: routes.iconThemify,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Weather Icons',
              route: routes.iconWeather,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Typicon Icons',
              route: routes.iconTypicon,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Flag Icons',
              route: routes.iconFlag,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Tabler Icons',
              route: routes.tabler,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Bootstrap Icons',
              route: routes.bootstrap,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              menuValue: 'Remix Icons',
              route: routes.remix,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Forms',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [
            {
              tittle: 'Basic Inputs',
              route: routes.formBasicInputs,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Checkbox & Radios',
              route: routes.formCheckboxRadios,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Input Groups',
              route: routes.formInputsGroups,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Form Select',
              route: routes.formSelect,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Input Masks',
              route: routes.formMask,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'File Uploads',
              route: routes.formFileUpload,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Tables',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'table',
          subRoutes: [
            {
              tittle: 'Basic Tables',
              route: routes.basicTable,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Data Tables',
              route: routes.dataTable,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Maps',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'map',
          subRoutes: [
            
            {
              tittle: 'LeafLets',
              route: routes.leaflet,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
      ]
    },
    
    {
      tittle: 'Pages',
      hasSubRoute: true,
      icon: 'page-break',
      showSubRoute: false,
      subRoutes: [
        {
          tittle: 'Profile',
          route: routes.generalSettings,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          tittle: 'Authentication',
          hasSubRoute: true,
          showSubRoute: false,
          route: routes.purchaseReport,
          subRoutes: [
            {
              tittle: 'Login',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Cover',
                  route: routes.signIn,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Illustration',
                  route: routes.signIn2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Basic',
                  route: routes.signIn3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              tittle: 'Register',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Cover',
                  route: routes.register,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Illustration',
                  route: routes.register2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Basic',
                  route: routes.register3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              tittle: 'Forgot Password',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Cover',
                  route: routes.forgotPassword,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Illustration',
                  route: routes.forgotPassword2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Basic',
                  route: routes.forgotPassword3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              tittle: 'Reset Password',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Cover',
                  route: routes.resetPassword,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Illustration',
                  route: routes.resetPassword2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Basic',
                  route: routes.resetPassword3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              tittle: 'Email Verification',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Cover',
                  route: routes.emailVerification,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Illustration',
                  route: routes.emailVerification2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Basic',
                  route: routes.emailVerification3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
            {
              tittle: '2 Step Verification',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Cover',
                  route: routes.twoStepVerification,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Illustration',
                  route: routes.twoStepVerification2,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Basic',
                  route: routes.twoStepVerification3,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
              ],
            },
          ],
        },
        {
          tittle: 'Lock Screen',
          hasSubRoute: false,
          showSubRoute: false,
          route:routes.lockScreen,
          subRoutes: []
        },
        {
          tittle: 'Error',
          hasSubRoute: true,
          showSubRoute: false,
          route: '/error',
          subRoutes: [
            {
              tittle: '404 Error',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.error404,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: '500 Error',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.error500,
              customSubmenuTwo: false,
              subRoutes: [],
            }
          ],
        },
        {
          tittle: 'Blank page',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.blankPage,
          subRoutes: [],
        },
        {
          tittle: 'Pricing',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.pricing,
          subRoutes: [],
        },
        {
          tittle: 'Comming Soon',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.comingSoon,
          subRoutes: [],
        },
        {
          tittle: 'Under Maintenance',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.underMaintanance,
          subRoutes: [],
        },
        {
          tittle: 'Content',
          hasSubRoute: true,
          showSubRoute: false,
          subRoutes: [
            {
              tittle: 'Pages',
              hasSubRoute: true,
              showSubRoute: false,
              
              customSubmenuTwo: true,
              subMenusTwo:[
                {
                  tittle: 'Pages',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.page,
                  subRoutes: [],
                }
              ],
            },
            {
              tittle: 'Blogs',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'All Blogs',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.allBlog,
                  subRoutes: [],
                },
                {
                  tittle: 'Blog Tags',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.blogTag,
                  subRoutes: [],
                },
                {
                  tittle: 'Categories',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.categories,
                  subRoutes: [],
                },
                {
                  tittle: 'Blog Comments',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.blogComments,
                  subRoutes: [],
                },
              ],
            },
            {
              tittle: 'Location',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Countries',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.countries,
                  subRoutes: [],
                },
                {
                  tittle: 'States',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.states,
                  subRoutes: [],
                },
                {
                  tittle: 'Cities',
                  hasSubRoute: false,
                  showSubRoute: false,
                  route: routes.cities,
                  subRoutes: [],
                },
              ],
            },
            {
              tittle: 'Testimonial',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.testimonial,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'FAQ',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.faq,
              subRoutes: [],
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Employees',
          hasSubRoute: true,
          showSubRoute: false,
          subRoutes: [
            {
              tittle: 'Employees',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.employeesGrid,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Departments',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.departmentGrid,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Designation',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.designation,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Shifts',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.shift,
              subRoutes: [],
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Attendance',
          hasSubRoute: true,
          showSubRoute: false,
          route: '/atte',
          subRoutes: [
            {
              tittle: 'Employee Attendence',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.attendanceEmployee,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Admin Attendence',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.attendanceAdmin,
              subRoutes: [],
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Leaves & Holidays',
          hasSubRoute: true,
          showSubRoute: false,
          route: '/atte',
          subRoutes: [
            {
              tittle: 'Admin Leaves',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.leavesAdmin,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Employee Leaves',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.leavesEmployee,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Leave Types',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.leavesType,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Holidays',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.holidays,
              subRoutes: [],
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Payroll',
          hasSubRoute: true,
          showSubRoute: false,
          route: '/atte',
          subRoutes: [
            {
              tittle: 'Employee Salary',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.payrollList,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Payslip',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.paySlip,
              subRoutes: [],
              customSubmenuTwo: false,
            },
          ],
        },
      ],
    },
    {
      tittle: 'Reports',
      hasSubRoute: true,
      icon: 'chart-bar',
      showSubRoute: false,
      activeRoute: 'users',
      subRoutes: [
        {
          tittle: 'Sales Report',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'sales',
          subRoutes: [
            {
              tittle: 'Sales Report',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.salesReport,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Best Seller',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.bestSeller,
              customSubmenuTwo: false,
              subRoutes: []
            }
          ],
        },
        {
          tittle: 'Purchase Report',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.purchaseReport,
          subRoutes: [],
        },
        {
          tittle: 'Inventory Report',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'inventory',
          subRoutes: [
            {
              tittle: 'Inventory Report',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.inventoryReport,
              customSubmenuTwo: false,
              subRoutes: []
            },
            {
              tittle: 'Stock History',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.stockHistory,
              customSubmenuTwo: false,
              subRoutes: []
            },
            {
              tittle: 'Sold Stock',
              hasSubRoute: true,
              showSubRoute: false,
              route: routes.soldStock,
              customSubmenuTwo: false,
              subRoutes: []
            }
          ],
        },
        {
          tittle: 'Invoice Report',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.invoiceReport,
          subRoutes: [],
        },
        {
          tittle: 'Supplier Report',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'supplier',
          subRoutes: [
            {
              tittle: 'Supplier Report',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.supplierReport,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Supplier Due Report',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.supplierDueReport,
              customSubmenuTwo: false,
              subRoutes: [],
            }
          ],
        },
        {
          tittle: 'Customer Report',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'Customer',
          subRoutes: [
            {
              tittle: 'Customer Report',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.customerReport,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Customer Due Report',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.customerDueReport,
              customSubmenuTwo: false,
              subRoutes: [],
            }
          ],
        },
        {
          tittle: 'Product Report',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'product',
          subRoutes: [
            {
              tittle: 'Product Report',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.productReport,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Product Expiry Report',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.productExpiryReport,
              customSubmenuTwo: false,
              subRoutes: [],
            },
            {
              tittle: 'Product Quanity Alert',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.productQuantityAlert,
              customSubmenuTwo: false,
              subRoutes: [],
            }
          ],
        },
        {
          tittle: 'Expense Report',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.expenseReport,
          subRoutes: [],
        },
        {
          tittle: 'Income Report',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.incomeReport,
          subRoutes: [],
        },
        {
          tittle: 'Tax Report',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.taxReport,
          subRoutes: [],
        },
        {
          tittle: 'Profit & Loss',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.profitAndLoss,
          subRoutes: [],
        },
        {
          tittle: 'Annual Report',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.annualReport,
          subRoutes: [],
        },
      ],
    },
    {
      tittle: 'Settings',
      hasSubRoute: true,
      icon: 'settings',
      showSubRoute: false,
      activeRoute: 'users',
      subRoutes: [
        {
          tittle: 'General Settings',
          hasSubRoute: true,
          showSubRoute: false,
          route: routes.users,
          subRoutes: [
            {
              tittle: 'Profile',
              route: routes.generalSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Security',
              route: routes.securitySettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Notifications',
              route: routes.settingsNotification,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Connected Apps',
              route: routes.connectedApps,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Website Settings',
          hasSubRoute: true,
          showSubRoute: false,
          subRoutes: [
            {
              tittle: 'System Settings',
              route: routes.systemSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Company Settings',
              route: routes.companySettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Localization',
              route: routes.localizationSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Prefixes',
              route: routes.prefixes,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Preference',
              route: routes.preference,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Appearance',
              route: routes.appearance,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Social Authentication',
              route: routes.socialAuthentication,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Language',
              route: routes.languageSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },

        {
          tittle: 'App Settings',
          hasSubRoute: true,
          icon: 'assets/img/icons/printer.svg',
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [
            {
              tittle: 'Invoice',
              activeRoute: 'Invoice',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Invoice Settings',
                  route: routes.invoiceSettings,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Invoice Template',
                  route: routes.invoiceTemplate,
                  hasSubRoute: false,
                  showSubRoute: false,
                }
              ]
            },
            {
              tittle: 'Printer',
              route: routes.printerSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'POS',
              route: routes.posSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Custom Fields',
              route: routes.customFields,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'System Settings',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [
            {
              tittle: 'Email',
              activeRoute: 'email',
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Email Settings',
                  route: routes.emailSettings,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'Email Template',
                  route: routes.emailTemplates,
                  hasSubRoute: false,
                  showSubRoute: false,
                }
              ]
            },
            {
              tittle: 'SMS',
              route: routes.smsGateway,
              hasSubRoute: true,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'SMS Settings',
                  route: routes.smsGateway,
                  hasSubRoute: false,
                  showSubRoute: false,
                },
                {
                  tittle: 'SMS Template',
                  route: routes.smsTemplates,
                  hasSubRoute: false,
                  showSubRoute: false,
                }
              ]
            },
            {
              tittle: 'OTP',
              route: routes.otpSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'GDPR Cookies',
              route: routes.gdprSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Financial Settings',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [
            {
              tittle: 'Payment Gateway',
              route: routes.paymentGatewaySettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Bank Accounts',
              route: routes.bankSettingsGrid,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Tax Rates',
              route: routes.taxRates,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Currencies',
              route: routes.currencySettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Other Settings',
          hasSubRoute: true,
          showSubRoute: false,
          activeRoute: 'users',
          subRoutes: [
            {
              tittle: 'Storage',
              route: routes.storageSettings,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
            {
              tittle: 'Ban IP Address',
              route: routes.banIpAddress,
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Documentation',
          hasSubRoute: false,
          showSubRoute: false,
          activeRoute: 'users',
        },
        {
          tittle: 'Changelog v2.0.7',
          hasSubRoute: false,
          showSubRoute: false,
          activeRoute: 'users',
        },
      ],
    },
    {
      tittle: 'More',
      hasSubRoute: true,
      icon: 'circle-plus',
      showSubRoute: false,
      activeRoute: 'users',
      subRoutes: [
        {
          tittle: 'People',
          hasSubRoute: true,
          showSubRoute: false,
          subRoutes: [
            {
              tittle: 'Customers',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.customers,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Billers',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.billers,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Suppliers',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.suppliers,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Stores',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.storeList,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Warehouses',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.wareHouse,
              subRoutes: [],
              customSubmenuTwo: false,  
            },
          ],
        },
        {
          tittle: 'Roles & Permissions',
          hasSubRoute: true,
          showSubRoute: false,
          route: routes.users,
          subRoutes: [
            {
              tittle: 'Users',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.users,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Roles & Permissions',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.rolesPermission,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Delete Account Request',
              hasSubRoute: false,
              showSubRoute: false,
              route: routes.deleteaccount,
              subRoutes: [],
              customSubmenuTwo: false,
            },
          ],
        },
        {
          tittle: 'Help',
          hasSubRoute: true,
          showSubRoute: false,
          route: routes.users,
          subRoutes: [
            {
              tittle: 'Documentation',
              hasSubRoute: false,
              showSubRoute: false,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Changelogv2.0.9',
              hasSubRoute: false,
              showSubRoute: false,
              subRoutes: [],
              customSubmenuTwo: false,
            },
            {
              tittle: 'Multi Level',
              hasSubRoute: false,
              showSubRoute: false,
              customSubmenuTwo: true,
              subMenusTwo: [
                {
                  tittle: 'Level 1.1',
                  hasSubRoute: false,
                  showSubRoute: false,
                  subRoutes: [],
                },
                {
                  tittle: 'Level 1.2',
                  hasSubRoute: false,
                  showSubRoute: false,
                  subRoutes: [],
                }
              ],
            },
          ],
        },
      ],
    },
  ];
  
  public settings_sidebar = [
    {
      icon: 'ti ti-settings',
      title: 'General Settings',
      page: 'general-settings',
      expanded: false,
      subMenu: [
        { title: 'Profile', routes: routes.generalSettings,last:'profile' },
        { title: 'Security', routes: routes.securitySettings },
        { title: 'Notifications', routes: routes.settingsNotification },
        { title: 'Connected Apps', routes: routes.connectedApps },
      ],
    },
    {
      icon: 'ti ti-world',
      title: 'Website Settings',
      page: 'website-settings',
      expanded: false,
      subMenu: [
        { title: 'System Settings', routes: routes.systemSettings },
        { title: 'Company Settings', routes: routes.companySettings },
        { title: 'Localization', routes: routes.localizationSettings },
        { title: 'Prefixes', routes: routes.prefixes },
        { title: 'Preference', routes: routes.preference },
        { title: 'Appearance', routes: routes.appearance },
        {
          title: 'Social Authentication',
          routes: routes.socialAuthentication,
        },
        { title: 'Language', routes: routes.languageSettings },
      ],
    },
    {
      icon: 'ti ti-device-mobile',
      title: 'App Settings',
      page: 'app-settings',
      expanded: false,
      subMenu: [
        { title: 'Invoice', routes: routes.invoiceSettings },
        { title: 'Invoice Templates', routes: routes.invoiceTemplate },
        { title: 'Printer', routes: routes.printerSettings },
        { title: 'POS', routes: routes.posSettings },
        { title: 'Signatures', routes: routes.signatures },
        { title: 'Custom Fields', routes: routes.customFields },
      ],
    },
    {
      icon: 'ti ti-device-desktop',
      title: 'System Settings',
      page: 'system-settings',
      expanded: false,
      subMenu: [
        { title: 'Email', routes: routes.emailSettings },
        { title: 'Email Templates', routes: routes.emailTemplates },
        { title: 'SMS Gateways', routes: routes.smsGateway },
        { title: 'SMS Templates', routes: routes.smsTemplates },
        { title: 'OTP', routes: routes.otpSettings },
        { title: 'GDPR Cookies', routes: routes.gdprSettings },
      ],
    },
    {
      icon: 'ti ti-settings-dollar',
      title: 'Financial Settings',
      page: 'financial-settings',
      expanded: false,
      subMenu: [
        { title: 'Payment Gateway', routes: routes.paymentGatewaySettings },
        { title: 'Bank Accounts', routes: routes.bankSettingsGrid },
        { title: 'Tax Rates', routes: routes.taxRates },
        { title: 'Currencies', routes: routes.currencySettings },
      ],
    },
    {
      icon: 'ti ti-settings-2',
      title: 'Other Settings',
      page: 'other-settings',
      expanded: false,
      subMenu: [
        { title: 'Storage', routes: routes.storageSettings },
        { title: 'Ban IP Address', routes: routes.banIpAddress },
      ],
    },
  ];
  public videocall = [
    {
      img: 'assets/img/users/user-01.jpg',
      name: 'Barbara',
    },
    {
      img: 'assets/img/users/user-02.jpg',
      name: 'Linnea',
    },
    {
      img: 'assets/img/users/user-05.jpg',
      name: 'Richard',
    },
    {
      img: 'assets/img/users/user-03.jpg',
      name: 'Freda',
    },
  ];
}
