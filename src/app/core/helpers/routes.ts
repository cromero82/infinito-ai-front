export class routes {
  private static base = '';
  static paymentreport: string;

  public static get baseUrl(): string {
    return this.base;
  }
  // auth routes *start*
  
  public static get signIn(): string {
    return this.base + '/signin';
  }
  public static get signUp(): string {
    return this.base + '/signup';
  }
  public static get forgotPassword(): string {
    return this.base + '/forgot-password';
  }
  public static get forgotPassword2(): string {
    return this.base + '/forgot-password-2';
  }
  public static get forgotPassword3(): string {
    return this.base + '/forgot-password-3';
  }
  // auth routes *end*

  // error pages routes *start*

  public static get errorPages(): string {
    return this.baseUrl + '/error-pages';
  }
  public static get error404(): string {
    return this.errorPages + '/error-404';
  }
  public static get error500(): string {
    return this.errorPages + '/error-500';
  }
  // error pages routes *ends*

  // core pages routes *start*

  public static get core(): string {
    return this.baseUrl;
  }
  public static get dashboard(): string {
    return this.baseUrl + '/dashboard';
  }
  public static get components(): string {
    return this.core + '/components';
  }
  public static get blankPage(): string {
    return this.pages + '/blank-page';
  }
  public static get pricing(): string {
    return this.pages + '/pricing';
  }
  public static get product(): string {
    return this.core + '/product';
  }
  public static get sales(): string {
    return this.core + '/sales';
  }
  public static get purchase(): string {
    return this.core + '/purchase';
  }
  public static get expense(): string {
    return this.core + '/expense';
  }
  public static get quotation(): string {
    return this.core + '/quotation';
  }
  public static get transfer(): string {
    return this.core + '/transfer';
  }

  public static get return(): string {
    return this.core + '/return';
  }
  public static get people(): string {
    return this.core + '/people';
  }
  public static get places(): string {
    return this.core + '/places';
  }
  public static get element(): string {
    return this.core + '/element';
  }
  public static get charts(): string {
    return this.core + '/charts';
  }
  public static get icons(): string {
    return this.core + '/icons';
  }
  public static get forms(): string {
    return this.core + '/forms';
  }
  public static get table(): string {
    return this.core + '/table';
  }
  public static get leaflet(): string {
    return this.baseUrl + '/maps/leaflets';
  }
  public static get application(): string {
    return this.core + '/application';
  }
  public static get reports(): string {
    return this.core + '/reports';
  }
  public static get usersManagement(): string {
    return this.core + '/user-management';
  }
  public static get settings(): string {
    return this.core + '/settings';
  }
  public static get profile(): string {
    return this.pages + '/profile';
  }
  public static get activities(): string {
    return this.pages + '/activities';
  }
  // core pages routes *ends*

  // core pages child routes

  public static get productList(): string {
    return this.inventory + '/product/product-list';
  }
  public static get addProduct(): string {
    return this.inventory + '/product/add-product';
  }
  public static get expiredProduct(): string {
    return this.inventory + '/product/expired-products';
  }
  public static get categoryList(): string {
    return this.inventory + '/category/category-list';
  }
  public static get addCategory(): string {
    return this.product + '/add-category';
  }
  public static get subCategories(): string {
    return this.inventory + '/category/sub-categories';
  }
  public static get addSubcategory(): string {
    return this.product + '/sub-add-category';
  }
  public static get addBrand(): string {
    return this.product + '/add-brand';
  }
  public static get importProduct(): string {
    return this.product + '/import-product';
  }
  public static get editProduct(): string {
    return this.inventory + '/product/edit-product';
  }
  public static get editCategory(): string {
    return this.product + '/edit-category';
  }
  public static get editSubCategory(): string {
    return this.product + '/edit-subcategory';
  }
  public static get editBrand(): string {
    return this.product + '/edit-brand';
  }
  public static get productDetails(): string {
    return this.inventory + '/product/product-details';
  }
  public static get brandList(): string {
    return this.inventory + '/brand-list';
  }
  public static get salesList(): string {
    return this.sales + '/online-order';
  }
  public static get PosOrder(): string {
    return this.sales + '/pos-order';
  }
  public static get onlineOrders(): string {
    return this.sales + '/online-orders';
  }
  public static get invoice(): string {
    return this.sales + '/invoice';
  }
  public static get invoiceDetails(): string {
    return this.sales + '/invoice-details';
  }
  public static get pos(): string {
    return this.sales + '/pos';
  }
  public static get pos2(): string {
    return this.sales + '/pos-2';
  }
  public static get pos3(): string {
    return this.sales + '/pos-3';
  }
  public static get pos4(): string {
    return this.sales + '/pos-4';
  }
  public static get pos5(): string {
    return this.sales + '/pos-5';
  }
  public static get salesReturnLists(): string {
    return this.sales + '/sales-return-lists';
  }
  public static get createSalesReturns(): string {
    return this.sales + '/create-sales-returns';
  }
  public static get addSales(): string {
    return this.sales + '/add-sales';
  }
  public static get editSalesReturns(): string {
    return this.sales + '/edit-sales-returns';
  }
  public static get editSales(): string {
    return this.sales + '/edit-sales';
  }
  public static get salesDetails(): string {
    return this.sales + '/sales-details';
  }

  public static get purchaseList(): string {
    return this.purchase + '/purchase-list';
  }
  public static get addPurchase(): string {
    return this.purchase + '/add-purchase';
  }
  public static get importPurchase(): string {
    return this.purchase + '/import-purchase';
  }
  public static get editPurchase(): string {
    return this.purchase + '/edit-purchase';
  }

  public static get expenseList(): string {
    return this.expense + '/expense-list';
  }
  public static get expenseCategory(): string {
    return this.expense + '/expense-category';
  }
  public static get createExpense(): string {
    return this.expense + '/create-expense';
  }
  public static get editExpense(): string {
    return this.expense + '/edit-expense';
  }

  public static get addQuotation(): string {
    return this.quotation + '/add-quotation';
  }
  public static get editQuotation(): string {
    return this.quotation + '/edit-quotation';
  }

  public static get transferList(): string {
    return this.transfer + '/transfer-list';
  }
  public static get addTransfer(): string {
    return this.transfer + '/add-transfer';
  }
  public static get importTransfer(): string {
    return this.transfer + '/import-transfer';
  }
  public static get editTransfer(): string {
    return this.transfer + '/edit-transfer';
  }

  public static get salesReturnList(): string {
    return this.return + '/sales-return-list';
  }
  public static get createSalesReturn(): string {
    return this.return + '/create-sales-return';
  }
  public static get purchaseReturnList(): string {
    return this.return + '/purchase-return-list';
  }
  public static get createPurchaseReturn(): string {
    return this.return + '/create-purchase-return';
  }
  public static get editSalesReturn(): string {
    return this.return + '/edit-sales-return';
  }
  public static get editPurchaseReturn(): string {
    return this.return + '/edit-purchase-return';
  }

  public static get customerList(): string {
    return this.people + '/customer-list';
  }
  public static get addCustomer(): string {
    return this.people + '/add-customer';
  }
  public static get suppliers(): string {
    return this.people + '/suppliers-list';
  }
  public static get addSupplier(): string {
    return this.people + '/add-supplier';
  }
  public static get userList(): string {
    return this.people + '/user-list';
  }
  public static get addUser(): string {
    return this.people + '/add-user';
  }
  public static get storeList(): string {
    return this.people + '/store-list';
  }
  public static get addStore(): string {
    return this.people + '/add-store';
  }
  public static get editCustomer(): string {
    return this.people + '/edit-customer';
  }
  public static get editSupplier(): string {
    return this.people + '/edit-supplier';
  }
  public static get editUser(): string {
    return this.people + '/edit-user';
  }
  public static get editStore(): string {
    return this.people + '/edit-store';
  }



  public static get content(): string {
    return this.baseUrl + '/content';
  }
  public static get page(): string {
    return this.content + '/pages';
  }
  public static get blogs(): string {
    return this.content + '/blogs';
  }
  public static get allBlog(): string {
    return this.blogs + '/all-blog';
  }
  public static get blogDetails(): string {
    return this.blogs + '/blog-details';
  }
  public static get blogTag(): string {
    return this.blogs + '/blog-tag';
  }
  public static get categories(): string {
    return this.blogs + '/categories';
  }
  public static get blogComments(): string {
    return this.blogs + '/blog-comments';
  }
  public static get location(): string {
    return this.content + '/location';
  }
  public static get countries(): string {
    return this.location + '/countries';
  }
  public static get cities(): string {
    return this.location + '/cities';
  }
  public static get states(): string {
    return this.location + '/states';
  }
  public static get testimonial(): string {
    return this.content + '/testimonial';
  }
  public static get faq(): string {
    return this.content + '/faq';
  }

  

  public static get newCountry(): string {
    return this.places + '/new-country';
  }
  public static get countriesList(): string {
    return this.places + '/countries-list';
  }
  public static get newState(): string {
    return this.places + '/new-state';
  }
  public static get stateList(): string {
    return this.places + '/state-list';
  }
  public static get editCountry(): string {
    return this.places + '/edit-country';
  }
  public static get editState(): string {
    return this.places + '/edit-state';
  }
  public static get tooltip(): string {
    return this.element + '/tooltip';
  }
  public static get popover(): string {
    return this.element + '/popover';
  }
  public static get notification(): string {
    return this.element + '/notification';
  }
  public static get lightbox(): string {
    return this.element + '/lightbox';
  }

  public static get stickyNote(): string {
    return this.element + '/sticky-note';
  }
  public static get formWizard(): string {
    return this.forms + '/form-wizard';
  }
  public static get formPickers(): string {
    return this.forms + '/form-pickers';
  }
  public static get chartApex(): string {
    return this.charts + '/chart-apex';
  }
  public static get chartPrime(): string {
    return this.charts + '/prime-ng';
  }

  public static get iconFontAwesome(): string {
    return this.icons + '/icon-fontawesome';
  }

  public static get iconFeather(): string {
    return this.icons + '/icon-feather';
  }
  public static get iconIonic(): string {
    return this.icons + '/icon-ionic';
  }
  public static get iconMaterial(): string {
    return this.icons + '/icon-material';
  }
  public static get iconPe7(): string {
    return this.icons + '/icon-pe7';
  }
  public static get iconSimpleline(): string {
    return this.icons + '/icon-simpleline';
  }

  public static get iconWeather(): string {
    return this.icons + '/icon-weather';
  }
  public static get iconThemify(): string {
    return this.icons + '/icon-themify';
  }
  public static get iconTypicon(): string {
    return this.icons + '/icon-typicon';
  }
  public static get iconFlag(): string {
    return this.icons + '/icon-flag';
  }
  public static get tabler(): string {
    return this.icons + '/icon-tabler';
  }
  public static get remix(): string {
    return this.icons + '/icon-remix';
  }
  public static get bootstrap(): string {
    return this.icons + '/icon-bootstrap';
  }
  public static get formBasicInputs(): string {
    return this.forms + '/form-basic-inputs';
  }
  public static get formInputsGroups(): string {
    return this.forms + '/form-input-groups';
  }
  public static get formHorizontal(): string {
    return this.forms + '/form-horizontal';
  }
  public static get formVertical(): string {
    return this.forms + '/form-vertical';
  }
  public static get formMask(): string {
    return this.forms + '/form-mask';
  }
  public static get formValidation(): string {
    return this.forms + '/form-validation';
  }
  public static get formSelect(): string {
    return this.forms + '/form-select';
  }
  public static get formFileUpload(): string {
    return this.forms + '/form-fileupload';
  }
  public static get formCheckboxRadios(): string {
    return this.forms + '/form-checkbox-radios';
  }
  public static get formElements(): string {
    return this.forms + '/form-elements';
  }
  public static get formGridGutters(): string {
    return this.forms + '/form-grid-gutters';
  }
  public static get formSelect2(): string {
    return this.forms + '/form-select-2';
  }
  public static get formFloatingLabels(): string {
    return this.forms + '/form-floating-labels';
  }
  public static get basicTable(): string {
    return this.table + '/tables-basic';
  }
  public static get dataTable(): string {
    return this.table + '/data-basic';
  }
  public static get chat(): string {
    return this.application + '/chat';
  }
  public static get calendar(): string {
    return this.application + '/calendar';
  }
  public static get contacts(): string {
    return this.application + '/contacts';
  }
  public static get email(): string {
    return this.application + '/email';
  }
  public static get purchaseOrderReport(): string {
    return this.purchase + '/purchase-order-report';
  }

  public static get newUser(): string {
    return this.users + '/new-user';
  }
  public static get usersUserList(): string {
    return this.users + '/user-lists';
  }
  public static get editUsersUserList(): string {
    return this.users + '/new-user-edit';
  }
  public static get generalSettings(): string {
    return this.settings + '/general-settings/profile';
  }
  public static get paymentSettings(): string {
    return this.settings + '/payment-settings';
  }
  public static get currencySettings(): string {
    return this.settings + '/financial-settings/currency-settings';
  }
  public static get groupSettings(): string {
    return this.settings + '/group-permissions';
  }
  public static get createPermission(): string {
    return this.settings + '/create-permission';
  }
  public static get editPermission(): string {
    return this.settings + '/edit-permission';
  }
  public static get advancedUi(): string {
    return this.core + '/advanced-ui';
  }

  public static get counter(): string {
    return this.advancedUi + '/ui-counter';
  }
  public static get clipboard(): string {
    return this.advancedUi + '/ui-clipboard';
  }

  public static get ribbon(): string {
    return this.advancedUi + '/ui-ribbon';
  }
  public static get rating(): string {
    return this.advancedUi + '/ui-rating';
  }
  public static get textEditor(): string {
    return this.advancedUi + '/ui-text-editor';
  }
  public static get scrollbar(): string {
    return this.advancedUi + '/ui-scrollbar';
  }
  public static get timeline(): string {
    return this.advancedUi + '/ui-timeline';
  }
  public static get dragDrop(): string {
    return this.advancedUi + '/ui-drag-drop';
  }

  public static get banIpAddress(): string {
    return this.settings + '/other-settings/ban-ip-address';
  }
  public static get register(): string {
    return this.base + '/register';
  }
  public static get register2(): string {
    return this.base + '/register-2';
  }
  public static get register3(): string {
    return this.base + '/register-3';
  }

  // base ui pages routes starts

  public static get baseUi(): string {
    return this.core + '/base-ui';
  }
  public static get avatar(): string {
    return this.baseUi + '/ui-avatar';
  }
  public static get cards(): string {
    return this.baseUi + '/ui-cards';
  }
  public static get buttons(): string {
    return this.baseUi + '/ui-buttons';
  }
  public static get accordion(): string {
    return this.baseUi + '/ui-accordion';
  }
  public static get uiPopovers(): string {
    return this.baseUi + '/ui-popovers';
  }
  public static get uiPlaceholders(): string {
    return this.baseUi + '/ui-placeholders';
  }
  public static get uiBadges(): string {
    return this.baseUi + '/ui-badges';
  }
  public static get uiBreadcrumb(): string {
    return this.baseUi + '/ui-breadcrumb';
  }
  public static get uiButtons(): string {
    return this.baseUi + '/ui-buttons';
  }
  public static get uiButtonsGroup(): string {
    return this.baseUi + '/ui-buttons-group';
  }
  public static get uiCards(): string {
    return this.baseUi + '/ui-cards';
  }
  public static get uiCarousel(): string {
    return this.baseUi + '/ui-carousel';
  }
  public static get uiCounter(): string {
    return this.baseUi + '/ui-counter';
  }
  public static get uiDropdowns(): string {
    return this.baseUi + '/ui-dropdowns';
  }
  public static get uiGrid(): string {
    return this.baseUi + '/ui-grid';
  }
  public static get uiImages(): string {
    return this.baseUi + '/ui-images';
  }
  public static get uiLightbox(): string {
    return this.baseUi + '/ui-lightbox';
  }
  public static get uiMedia(): string {
    return this.baseUi + '/ui-media';
  }
  public static get uiModals(): string {
    return this.baseUi + '/ui-modals';
  }
  public static get uiNavTabs(): string {
    return this.baseUi + '/ui-nav-tabs';
  }
  public static get uiOffcanvas(): string {
    return this.baseUi + '/ui-offcanvas';
  }
  public static get uiPagination(): string {
    return this.baseUi + '/ui-pagination';
  }
  public static get uiProgress(): string {
    return this.baseUi + '/ui-progress';
  }
  public static get uiRangeSlider(): string {
    return this.baseUi + '/ui-rangeslider';
  }
  public static get uiSpinner(): string {
    return this.baseUi + '/ui-spinner';
  }
  public static get uiSweetAlerts(): string {
    return this.baseUi + '/ui-sweetalerts';
  }
  public static get uiToasts(): string {
    return this.baseUi + '/ui-toasts';
  }
  public static get uiTooltips(): string {
    return this.baseUi + '/ui-tooltips';
  }
  public static get uiTypography(): string {
    return this.baseUi + '/ui-typography';
  }
  public static get uiVideo(): string {
    return this.baseUi + '/ui-video';
  }
  public static get uiAccordion(): string {
    return this.baseUi + '/ui-accordion';
  }
  public static get uiAvatar(): string {
    return this.baseUi + '/ui-avatar';
  }
  public static get uiBorders(): string {
    return this.baseUi + '/ui-borders';
  }
  public static get uiColors(): string {
    return this.baseUi + '/ui-colors';
  }
  public static get uiSortable(): string {
    return this.baseUi + '/ui-sortable';
  }
  public static get connectedapp(): string {
    return this.settings + '/general-settings/connected-app';
  }
  public static get hrm(): string {
    return this.core + '/hrm';
  }
  public static get addEmployee(): string {
    return this.hrm + '/employee/add-employee';
  }
  public static get employeeDetails(): string {
    return this.hrm + '/employee/employee-details';
  }
  public static get editEmployee(): string {
    return this.hrm + '/employee/edit-employee';
  }
  public static get deleteaccount(): string {
    return this.usersManagement + '/delete-account';
  }
  public static get uiAlerts(): string {
    return this.baseUi + '/ui-alerts';
  }
  // base ui pages routes ends

  public static get promo(): string {
    return this.core + '/promo';
  }
  public static get coupons(): string {
    return this.promo + '/coupons';
  }
  public static get giftCards(): string {
    return this.promo + '/gift-cards';
  }
  public static get discount(): string {
    return this.promo + '/discount';
  }
  public static get discountPlan(): string {
    return this.promo + '/discount-plan';
  }
  public static get designation(): string {
    return this.hrm + '/designation';
  }
  public static get department(): string {
    return this.hrm + '/department';
  }
  public static get departmentList(): string {
    return this.department + '/department-list';
  }
  public static get departmentGrid(): string {
    return this.department + '/department-grid';
  }
//finance

  public static get finance(): string {
    return this.base + '/finance';
  }
  public static get income(): string {
    return this.finance + '/income';
  }
  public static get incomeCategory(): string {
    return this.finance + '/income-category';
  }
  public static get accountList(): string {
    return this.finance + '/account-list';
  }
  public static get moneyTransfer(): string {
    return this.finance + '/money-transfer';
  }
  public static get balanceSheet(): string {
    return this.finance + '/balance-sheet';
  }
  public static get trailBalance(): string {
    return this.finance + '/trial-balance';
  }
  public static get cashFlow(): string {
    return this.finance + '/cash-flow';
  }
  public static get accountStatement(): string {
    return this.finance + '/account-statement';
  }

  //finance ends
  public static get inventory(): string {
    return this.base + '/inventory';
  }
  public static get barCode(): string {
    return this.inventory + '/barcode';
  }
  public static get attendance(): string {
    return this.hrm + '/attendance';
  }
  public static get attendanceAdmin(): string {
    return this.attendance + '/attendance-admin';
  }
 
  public static get attendanceEmployee(): string {
    return this.attendance + '/attendance-employee';
  }
  public static get callHistory(): string {
    return this.application + '/call-history';
  }
  public static get emailVerification(): string {
    return this.base + '/email-verification';
  }
  public static get emailVerification2(): string {
    return this.base + '/email-verification-2';
  }
  public static get emailVerification3(): string {
    return this.base + '/email-verification-3';
  }
  public static get employeesList(): string {
    return this.hrm + '/employee/employee-list';
  }
  public static get bankSettingsList(): string {
    return this.settings + '/financial-settings/bank-settings-list';
  }
  public static get bankSettingsGrid(): string {
    return this.settings + '/financial-settings/bank-settings-grid';
  }
  public static get warranty(): string {
    return this.inventory + '/warranty';
  }
  public static get fileManager(): string {
    return this.application + '/file-manager';
  }
  public static get fileArchived(): string {
    return this.application + '/file-archived';
  }
  public static get fileDocument(): string {
    return this.application + '/file-document';
  }
  public static get fileFavorites(): string {
    return this.application + '/file-favourites';
  }
  public static get fileManagerDeleted(): string {
    return this.application + '/file-manager-deleted';
  }
  public static get fileRecent(): string {
    return this.application + '/file-recent';
  }
  public static get salesDashboard(): string {
    return this.dashboard + '/sales-dashboard';
  }
  //Super Admin//
  public static get superAdmin():string{
    return this.baseUrl + '/super-admin'
  }
  public static get superadminDashboard():string{
    return this.superAdmin + '/dashboard'
  }
  public static get superadminCompanies():string{
    return this.superAdmin + '/companies'
  }
  public static get superadminSubscriptions():string{
    return this.superAdmin + '/subscriptions'
  }
  public static get superadminPackages():string{
    return this.superAdmin + '/packages'
  }
  public static get superadminDomain():string{
    return this.superAdmin + '/domain'
  }
  public static get purchaseTransaction():string{
    return this.superAdmin + '/purchase-transaction'
  }
  //Super Admin Ends//
  public static get audioCall(): string {
    return this.application + '/audio-call';
  }
  public static get videoCall(): string {
    return this.application + '/video-call';
  }
  public static get holidays(): string {
    return this.hrm + '/holidays';
  }
  public static get pages(): string {
    return this.core + '/pages';
  }
  public static get underMaintanance(): string {
    return this.pages + '/under-maintenance';
  }
  public static get languageSettings(): string {
    return this.settings + '/website-settings/language-settings';
  }
  public static get languageSettingsweb(): string {
    return this.settings + '/website-settings/language-settings-web';
  }
  public static get adminDashboard(): string {
    return this.dashboard + '/admin-dashboard';
  }
  public static get index(): string {
    return this.dashboard + '/index';
  }
  public static get toDo(): string {
    return this.application + '/todo';
  }
  public static get toDoList(): string {
    return this.application + '/todo-list';
  }
  public static get socialFeed(): string {
    return this.application + '/social-feed';
  }
  public static get searchList(): string {
    return this.application + '/search-list';
  }
  public static get kanban(): string {
    return this.application + '/projects';
  }
  public static get notes(): string {
    return this.application + '/notes';
  }
  public static get ecommerce(): string {
    return this.application + '/ecommerce';
  }
  public static get products(): string {
    return this.ecommerce + '/products';
  }
  public static get orders(): string {
    return this.ecommerce + '/orders';
  }
  public static get wishlist(): string {
    return this.ecommerce + '/wishlist';
  }
  public static get ecommerceCustomers(): string {
    return this.ecommerce + '/customers';
  }
  public static get cart(): string {
    return this.ecommerce + '/cart';
  }
  public static get checkout(): string {
    return this.ecommerce + '/checkout';
  }
  public static get reviews(): string {
    return this.ecommerce + '/reviews';
  }
  public static get stock(): string {
    return this.baseUrl + '/stock';
  }
  public static get lowStock(): string {
    return this.inventory + '/stock/low-stocks';
  }
  public static get units(): string {
    return this.inventory + '/units';
  }
  public static get varriantAttributes(): string {
    return this.inventory + '/varriant-attributes';
  }
  public static get qrCode(): string {
    return this.inventory + '/qrcode';
  }
  public static get manageStocks(): string {
    return this.stock + '/manage-stocks';
  }
  public static get stockAdjustment(): string {
    return this.stock + '/stock-adjustment';
  }
  public static get stockTransfer(): string {
    return this.stock + '/stock-transfer';
  }
  public static get securitySettings(): string {
    return this.settings + '/general-settings/security-settings';
  }
  public static get settingsNotification(): string {
    return this.settings + '/general-settings/notification';
  }
  public static get connectedApps(): string {
    return this.settings + '/general-settings/connected-apps';
  }
  public static get systemSettings(): string {
    return this.settings + '/website-settings/system-settings';
  }
  public static get companySettings(): string {
    return this.settings + '/website-settings/company-settings';
  }
  public static get localizationSettings(): string {
    return this.settings + '/website-settings/localization-settings';
  }
  public static get prefixes(): string {
    return this.settings + '/website-settings/prefixes';
  }
  public static get appearance(): string {
    return this.settings + '/website-settings/appearance';
  }
  public static get socialAuthentication(): string {
    return this.settings + '/website-settings/social-authentication';
  }
  public static get preference(): string {
    return this.settings + '/website-settings/preference';
  }
  public static get invoiceSettings(): string {
    return this.settings + '/app-settings/invoice-settings';
  }
  public static get invoiceTemplate(): string {
    return this.settings + '/app-settings/invoice-template';
  }
  public static get printerSettings(): string {
    return this.settings + '/app-settings/printer-settings';
  }
  public static get posSettings(): string {
    return this.settings + '/app-settings/pos-settings';
  }
  public static get signatures(): string {
    return this.settings + '/app-settings/signatures';
  }
  public static get customFields(): string {
    return this.settings + '/app-settings/custom-fields';
  }
  public static get emailSettings(): string {
    return this.settings + '/system-settings/email-settings';
  }
  public static get emailTemplates(): string {
    return this.settings + '/system-settings/email-templates';
  }
  public static get smsGateway(): string {
    return this.settings + '/system-settings/sms-gateway';
  }
  public static get smsTemplates(): string {
    return this.settings + '/system-settings/sms-templates';
  }
  public static get otpSettings(): string {
    return this.settings + '/system-settings/otp-settings';
  }
  public static get gdprSettings(): string {
    return this.settings + '/system-settings/gdpr-settings';
  }
  public static get paymentGatewaySettings(): string {
    return this.settings + '/financial-settings/payment-gateway-settings';
  }
  public static get taxRates(): string {
    return this.settings + '/financial-settings/tax-rates';
  }
  public static get storageSettings(): string {
    return this.settings + '/other-settings/storage-settings';
  }
  public static get salesReturn(): string {
    return this.sales + '/sales-return';
  }
  public static get quotationList(): string {
    return this.sales + '/quotation-list';
  }
  public static get purchaseReturns(): string {
    return this.purchase + '/purchase-returns';
  }
  public static get signIn2(): string {
    return this.base + '/signin-2';
  }
  public static get signIn3(): string {
    return this.base + '/signin-3';
  }
  public static get resetPassword(): string {
    return this.base + '/reset-password';
  }
  public static get resetPassword2(): string {
    return this.base + '/reset-password-2';
  }
  public static get resetPassword3(): string {
    return this.base + '/reset-password-3';
  }
  public static get twoStepVerification(): string {
    return this.base + '/two-step-verification';
  }
  public static get twoStepVerification2(): string {
    return this.base + '/two-step-verification-2';
  }
  public static get twoStepVerification3(): string {
    return this.base + '/two-step-verification-3';
  }
  public static get lockScreen(): string {
    return this.base + '/lock-screen';
  }
  public static get comingSoon(): string {
    return this.pages + '/coming-soon';
  }
  public static get wareHouse(): string {
    return this.people + '/warehouse';
  }
  public static get customers(): string {
    return this.people + '/customers';
  }
  public static get billers(): string {
    return this.people + '/billers';
  }
  public static get employeesGrid(): string {
    return this.hrm + '/employee/employee-grid';
  }
  public static get shift(): string {
    return this.hrm + '/shift';
  }
  public static get leavesAdmin(): string {
    return this.hrm + '/leaves/leaves-admin';
  }
  public static get leavesEmployee(): string {
    return this.hrm + '/leaves/leaves-employee';
  }
  public static get leavesType(): string {
    return this.hrm + '/leaves/leaves-type';
  }
  public static get payrollList(): string {
    return this.hrm + '/payroll/payroll-list';
  }
  public static get paySlip(): string {
    return this.hrm + '/payroll/payslip';
  }
  public static get rolesPermission(): string {
    return this.usersManagement + '/roles-permissions';
  }
  public static get users(): string {
    return this.usersManagement + '/users';
  }
  public static get fileShared(): string {
    return this.application + '/file-shared';
  }
  public static get customerReport(): string {
    return this.reports + '/customer-report';
  }
  public static get customerDueReport(): string {
    return this.reports + '/customer-due-report';
  }
  public static get expenseReport(): string {
    return this.reports + '/expense-report';
  }
  public static get incomeReport(): string {
    return this.reports + '/income-report';
  }
  public static get inventoryReport(): string {
    return this.reports + '/inventory-report';
  }
  public static get stockHistory(): string {
    return this.reports + '/stock-history';
  }
  public static get soldStock(): string {
    return this.reports + '/sold-stock';
  }
  public static get invoiceReport(): string {
    return this.reports + '/invoice-report';
  }
  public static get profitAndLoss(): string {
    return this.reports + '/profit-and-loss';
  }
  public static get purchaseReport(): string {
    return this.reports + '/purchase-report';
  }
  public static get salesReport(): string {
    return this.reports + '/sales-report';
  }
  public static get bestSeller(): string {
    return this.reports + '/best-seller';
  }
  public static get supplierReport(): string {
    return this.reports + '/supplier-report';
  }
  public static get supplierDueReport(): string {
    return this.reports + '/supplier-due-report';
  }
  public static get taxReport(): string {
    return this.reports + '/tax-report';
  }
  public static get salesTax(): string {
    return this.reports + '/sales-tax';
  }
  public static get annualReport(): string {
    return this.reports + '/annual-report';
  }
  public static get productReport(): string {
    return this.reports + '/product-report';
  }
  public static get productExpiryReport(): string {
    return this.reports + '/product-expiry-report';
  }
  public static get productQuantityAlert(): string {
    return this.reports + '/product-quantity-alert';
  }

  public static get success(): string {
    return this.base + '/success';
  }
  public static get success2(): string {
    return this.base + '/success-2';
  }
  public static get success3(): string {
    return this.base + '/success-3';
  }
  public static get permissions(): string {
    return this.usersManagement + '/permissions';
  }
  public static get Horizontal(): string {
    return this.baseUrl + '/layout-horizontal';
  }
  public static get Detached(): string {
    return this.baseUrl + '/layout-detached';
  }
  public static get Modern(): string {
    return this.baseUrl + '/layout-modern';
  }
  public static get TwoColumn(): string {
    return this.baseUrl + '/layout-two-column';
  }

  public static get Boxed(): string {
    return this.baseUrl + '/layout-boxed';
  }
  public static get RTL(): string {
    return this.baseUrl + '/layout-rtl';
  }
  public static get Dark(): string {
    return this.baseUrl + '/layout-dark';
  }
  // core pages child routes *ends*
}
