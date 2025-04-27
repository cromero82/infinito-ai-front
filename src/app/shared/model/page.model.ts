export interface countries {
  CountryName?: number;
  Region?: string;
  isSelected?: boolean;
  isStatus?: boolean;
}
export interface expenseCategoryList {
  sNo?: number;
  Date?: number;
  Categoryname?: string;
  Reference?: string;
  status?: string;
  Amount?: string;
  isSelected?: boolean;
  Description?: string;
}
export interface userList {
  sNo?: number;
  Username?: string;
  Phone?: string;
  email?: string;
  isSelected?: boolean;
  Role?: string;
  CreatedOn?: string;
  Status?: string;
}

export interface peopleUserList {
  sNo?: number;
  img?: string;
  Firstname?: string;
  Lastname?: string;
  Username?: string;
  Phone?: string;
  isSelected?: boolean;
  isStatus?: boolean;
  email?: string;
}

export interface transferList {
  sNo?: number;
  Date?: string;
  Reference?: string;
  isSelected?: boolean;
  From?: string;
  Paid?: string;
  items?: string;
  Grandtotal?: string;
  Status?: string;
}

export interface taxRates {
  sNo?: number;
  Taxname?: string;
  Tax?: string;
  isSelected?: boolean;
  isStatus?: boolean;
}

export interface paymentSettings {
  sNo?: number;
  PaymentTypeName?: string;
  isSelected?: boolean;
  isStatus?: boolean;
}

export interface groupPermission {
  sNo?: number;
  Role?: string;
  description?: string;
  Status?: string;
  isSelected?: boolean;
}

export interface currencySettings {
  sNo?: number;
  currencyName?: string;
  currencyCode?: string;
  currencySymbol?: string;
  exchangerate?: string;
  createdOn?: string;
}

export interface salesreturn {
  sNo: number;
  img: string;
  img2:string;
  productName: string;
  date: string;
  customer: string;
  status: string;
  total:string;
  grandTotal: string;
  paid: string;
  due: string;
  paymentStatus: string;
  isSelected?: boolean;
}

export interface purchaseOrderReport {
  sNo: number;
  img: string;
  productName: string;
  purchasedAmount: string;
  purchasedQty: string;
  instockQty: string;
  isSelected?: boolean;
}

export interface invoiceReport {
  sNo?: number;
  Invoicenumber?: string;
  Customername?: string;
  isSelected?: boolean;
  Duedate?: string;
  Amount?: string;
  Paid?: string;
  Amountdue?: string;
  Status?: string;
}

export interface inventoryReport {
  sNo?: number;
  ProductName?: string;
  SKU?: string;
  Category?: string;
  isSelected?: boolean;
  Brand?: string;
  price?: string;
  Unit?: string;
  Instockqty?: string;
  img?: string;
}

export interface brandList {
  sNo?: number;
  brand: string;
  createdOn: string;
  status: string;
  img: string;
  isSelected?: boolean;
}

export interface stateList {
  sNo?: number;
  StateName?: string;
  CountryName?: string;
  isSelected?: boolean;
  isStatus?: boolean;
}

export interface customerReport {
  sNo?: number;
  Customercode?: string;
  Customername?: string;
  isSelected?: boolean;
  Amount?: string;
  Paid?: string;
  Amountdue?: string;
  Status?: string;
  PaymentStatus?: string;
}

export interface subcategoryList {
  sNo?: number;
  Image?: string;
  Category?: string;
  Parentcategory?: string;
  CategoryCode?: string;
  isSelected?: boolean;
  Description?: string;
  CreatedBy?: string;
}

export interface productList {
  sNo: number;
  product: string;
  SKU: string;
  category: string;
  brand: string;
  price: string;
  unit: string;
  qty: string;
  createdBy: string;
  img1: string;
  img2: string;
  isSelected?: boolean;
}

export interface purchaseList {
  sNo: number;
  supplierName: string;
  reference: string;
  date: string;
  status: string;
  total: string;
  paid: string;
  due: string;
  paymentStatus: string;
  isSelected?: boolean;
}

export interface purchaseReturns {
  sNo: number;
  img: string;
  date: string;
  supplierName: string;
  reference: string;
  status: string;
  total: string;
  paid: string;
  due: string;
  paymentStatus: string;
  isSelected?: boolean;
}
export interface supplierList {
  sNo?: number;
  img?: string;
  SupplierName?: string;
  code?: string;
  isSelected?: boolean;
  Customer?: string;
  email?: string;
  Country?: string;
}
export interface storeList {
  sNo?: number;
  Storename?: string;
  Username?: string;
  Phone?: string;
  isSelected?: boolean;
  email?: string;
  isStatus?: boolean;
}

export interface customerList {
  sNo?: number;
  img?: string;
  CustomerName?: string;
  code?: string;
  Customer?: string;
  Phone?: string;
  email?: string;
  isSelected?: boolean;
  Country?: string;
}
export interface datatables {
  isSelected: boolean;
  sNo?: number;
  name?: string;
  position?: string;
  office?: string;
  age?: string;
  salary?: string;
  startDate?: string;
  id?: string;
}
export interface expenseList {
  sNo?: number;
  category?: string;
  reference?: string;
  date?: string;
  expenseName?: string;
  status?: string;
  amount?: string;
  description?: string;
  isSelected?: boolean;
}

export interface Star {
  show?: boolean;
  half?: boolean;
}

export interface pos {
  Date?: string;
  Reference?: string;
  Customer?: string;
  Amount?: string;
}

export interface subRoutes {
  tittle?: string;
  hasSubRoute?: boolean;
  icon?: string;
  showSubRoute?: boolean;
  route?: string;
  activeRoute?: string;
  customSubmenuTwo?:boolean;
  subRoutes?:subRoutes[];
}
export interface ScheduleEvent {
  id?: string;
  title?: string;
  start?: string;
}

export interface Permission {
  View: boolean;
  Create: boolean;
  Edit: boolean;
  Delete: boolean;
  ViewAllRecords: boolean;
  Barcode: boolean;
  SelectAll: boolean;
  Name: string;
  details: string;
  ImportProducts: string;
  editpermission: string;
}
export interface DeleteAccount {
  sNo?: number;
  userImg?: string;
  CustomerName?: string;
  code?: string;
  Customer?: string;
  Phone?: string;
  email?: string;
  isSelected?: boolean;
  Country?: string;
  userName?: string;
  requisition?: string;
  delete?: string;
}
export interface Coupons {
  name: string;
  code: string;
  description: string;
  type: string;
  discount: string;
  limit: number;
  valid: string;
  status: string;
  sNo?: number;
  isSelected?: boolean;
}
export interface discountPlan {
  planName: string,
  customers: string,
  status: string,
  sNo?: number;
  isSelected?: boolean;
}
export interface discount {
  name: string;
  value: string;
  discountPlan: string;
  validity: string;
  days: string;
  products: string;
  status: string
  sNo?: number;
  isSelected?: boolean;
}



export interface designation {
  designation?: string;
  createdOn?: string;
  members?: string;
  department?:string;
  sNo?: number;
  status:string;
  isSelected?: boolean;
}
export interface departmentList {
  department?: string;
  hod?: string;
  members?: string;
  createdon?: string;
  sNo?: number;
  img?: string;
  status?: string;
}

export interface barcode {
  sNo: number;
  product: string;
  sku: string;
  code: string;
  img: string;
}
export interface expenseCategory {
  sNo: number;
  CategoryName: string;
  description: string;
  img: string;
  status:string;
  isSelected?: boolean;
}
export interface income {
  sNo: number;
  isSelected?: boolean;
  date: string;
  reference: string;
  store: string;
  category: string;
  notes: string;
  amount: string
}
export interface expiredProducts {
  sNo: number;
  product: string;
  sku: string;
  code: string;
  img: string;
  manufacturedDate: string;
  expiredDate: string;
  isSelected: boolean,
}
export interface employeeList {
  sNo: number;
  img: string;
  employee: string;
  id: string;
  designation: string;
  employeeID: string;
  email: string;
  phone: string;
  shift: string;
  status: string;
  isSelected?: boolean;
}
export interface bankSettingsList {
  sNo: number;
  name: string;
  bank: string;
  branch: string;
  accountNo: string;
  ifsc: string;
  createdOn: string;
  isSelected?: boolean;
}
export interface customFiled {
  sNo: number;
  module: string;
  label: string;
  type: string;
  defaultvalue: string;
  required: string;
  isSelected?: boolean;
}
export interface attendenceAdmin {
  sNo: number;
  employee: string;
  img: string;
  designation: string;
  break: string;
  Date: string;
  status: string;
  clockIn: string;
  clockOut: string;
  production: string;
  overtime: string;
  totalHours: string;
  isSelected?: boolean;
}
export interface attendenceEmployee {
  sNo: number;
  date: string;
  clockIn: string;
  clockOut: string;
  production: string;
  overTime: string;
  break: string;
  status: string;
  totalHours: string;
  isSelected?: boolean;
}
export interface file {
  sNo: number;
  name: string;
  lastModified: string;
  size: string;
  ownedMember: string;
  modified: string;
  memberimg: string;
  folderimg: string;
  isSelected?: boolean;
}
export interface holiday {
  sNo: number;
  type: string;
  date: string;
  description: string;
  status: string;
  isSelected?: boolean;
}
export interface languagesetting {
  sNo: number;
  language: string;
  code: string;
  rtl: string;
  total: string;
  done: string;
  progress: string;
  status: string;
  img:string;
  isSelected?: boolean;
}
export interface callHistory {
  sNo: number;
  username: string;
  phoneNumber: string;
  callType: string;
  duration: string;
  dateTime: string;
  img: string;
  video: boolean;
  audio: boolean;
  isSelected?: boolean;
}
export interface categoryList {
  sNo: number;
  category: string;
  categorySlug: string;
  createdOn: string;
  status: string;
  isSelected?: boolean;
}
export interface expiredproduct {
  sNo: number;
  product: string;
  sku: string;
  manufacturedDate: string;
  expiredDate: string;
  img: string;
  isSelected?: boolean;
}
export interface unit {
  sNo: number;
  unit: string;
  shortName: string;
  noOfProducts: string;
  createdOn: string;
  status: string;
  isSelected?: boolean;
}
export interface countries {
  sNo: number;
  countryName: string;
  status: string;
}
export interface state {
  sNo: number;
  stateName: string;
  country: string;
  status: string;
  isSelected?: boolean;
}
export interface customer {
  sNo: number;
  customerName: string;
  code: string;
  customer: string;
  img: string;
  email: string;
  status: string;
  phone: string;
  country: string;
  isSelected?: boolean;
}
export interface printer {
  sNo: number;
  printerName: string;
  connectionType: string;
  ipAddress: string;
  port: string;
}
export interface fileShared {
  sNo: number;
  name: string;
  lastModified: string;
  size: string;
  ownedMember: string;
  img1: string;
  img2: string;
  isSelected?: boolean;
}
export interface rolesPermissions {
  sNo: number;
  role: string;
  createdDate: string;
  status:string;
  isSelected?: boolean;
}
export interface salesList {
  sNo: number;
  CustomerName: string;
  Reference: string;
  Date: string;
  Status: string;
  GrandTotal: string;
  Paid: string;
  Due: string;
  PaymentStatus: string;
  Biller: string;
  img: string;
  isSelected?: boolean;
}


export interface shift {
  sNo: number;
  shiftName: string;
  time: string;
  weekOff: string;
  createdOn: string;
  status: string;
  isSelected?: boolean;
}

export interface lowStocks {
  sNo: number;
  warehouse: string;
  store: string;
  product: string;
  category: string;
  sku: string;
  qty: string;
  qtyAlert: string;
  img: string;
  isSelected?: boolean;
}
export interface manageStocks {
  sNo: number;
  warehouse: string;
  store: string;
  product: string;
  date: string;
  person: string;
  quantity: string;
  img: string;
  img2: string;
  isSelected?: boolean;
}
export interface warranty {
  sNo: number;
  warranty: string;
  description: string;
  duration: string;
  status: string;
  isSelected?: boolean;
}
export interface payrollList {
  employee: string;
  id: string;
  role: string;
  email: string;
  salary: string;
  status: string;
  img: string;
  sNo: number;
  isSelected?: boolean;
  

}
export interface salesReport {
  sNo: number;
  productName: string;
  img: string;
  SKU: string;
  category: string;
  brand: string;
  soldQty: string;
  soldAmount: string;
  instockQty: string;
  isSelected?: boolean;
}
export interface variantAttributes {
  sNo: number;
  variant: string;
  values: string;
  createdOn: string;
  status: string;
  isSelected?: boolean;
}
export interface stock {
  sNo: number;
  fromWarehouse: string;
  toWarehouse: string;
  noOfProducts: string;
  quantityTransferred: string;
  refNumber: string;
  date: string;
  isSelected?: boolean;
}
export interface stockadjustment {
  sNo: number;
  warehouse: string;
  store: string;
  product: string;
  date: string;
  person: string;
  quantity: string;
  img: string;
  img2: string;
  isSelected?: boolean;
}

export interface salesInvoice {
  sNo: number;
  isSelected?: boolean;
  invoiceNo: string;
  customer: string;
  dueDate: string;
  amount: string;
  paid: string;
  amountDue: string;
  status: string;
  img: string;
}
export interface users {
  sNo: number;
  img: string;
  userName: string;
  phone: string;
  email: string;
  role: string;
  createdOn: string;
  status: string;
  isSelected?: boolean;
}
export interface quotationList {
  sNo: number;
  img: string;
  img2: string;
  productName: string;
  reference: string;
  customer: string;
  status: string;
  total: string;
  isSelected?: boolean;
  

}
export interface qrCode {
  sNo: number;
  product: string;
  sku: string;
  code: string;
  referenceNo: string;
  qty: string;
  img: string;
}
export interface leavesadmin {
  sNo: number;
  employee: string;
  id: string;
  type: string;
  designation:string;
  fromDate: string;
  toDate: string;
  daysOrHours: string;
  shift: string;
  appliedOn: string;
  status: string;
  img: string;
  value:string;
  isSelected?: boolean;
}
export interface leavestype {
  sNo?: number;
  name: string;
  leaveQuota: string;
  createdOn: string;
  status: string;
  isSelected?: boolean;
}
export interface leavesemployee {
  sNo?: number;
  empId: string;
  type: string;
  fromDate: string;
  toDate: string;
  daysOrHours: string;
  appliedOn: string;
  reason: string;
  status: string;
  isSelected?: boolean;
}
export interface storeList {
  sNo?: number;
  storeName: string;
  userName: string;
  phone: string;
  email?: string;
  status?: string;
}
export interface subcategories {
  sNo?: number;
  subCategory: string;
  category: string;
  categoryCode: string;
  description?: string;
  status?: string;
  image?: string;
  isSelected?: boolean;
}
export interface supplier {
  sNo?: number;
  supplier: string;
  code: string;
  email: string;
  phone?: string;
  img: string;
  country?: string;
  status: string;
  isSelected?: boolean;
}
export interface warehouse {
  sNo?: number;
  warehouse: string;
  contactPerson: string;
  phone: string;
  stock: string;
  qty: string;
  createdOn: string;
  status: string;
  totalProducts: string;
  img: string;
  isSelected?: boolean;
}

export interface biller {
  code: string;
  img:string;
  biller: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  status: string;
  sNo?: number;
  isSelected?: boolean;
}
export interface purchaseReport {
  sNo: number;
  productName: string;
  purchaseAmount: string;
  purchaseQty: string;
  instockQty: string;
  img: string;
  sku:string;
  dueDate:string;
  reference:string;
  category:string;
  isSelected?: boolean;
}
export interface taxrate {
  sNo?: number;
  name: string;
  taxRates: string;
  createdOn: string;
  isSelected?: boolean;
}
export interface inventoryreport {
  sNo?: number;
  productName: string;
  SKU: string;
  category: string;
  brand: string;
  unit: string;
  instockQty: string;
  img: string;
  isSelected?: boolean;
}
export interface invoicereport {
  sNo?: number;
  invoiceNo: string;
  customer: string;
  dueDate: string;
  amount: string;
  paid: string;
  amountDue: string;
  status: string;
  img: string;
  isSelected?: boolean;
}
export interface expensereport {
  sNo?: number;
  date: string;
  expenseName: string;
  category: string;
  description: string;
  status: string;
  amount: string;
  isSelected?: boolean;
}
export interface customerreport {
  sNo?: number;
  reference: string;
  customer: string;
  code: string;
  amount: string;
  img: string;
  paymentMethod: string;
  status: string;
  totalOrders: string;
  isSelected?: boolean;
}
export interface customerDueReport {
  sNo?: number;
  reference: string;
  customer: string;
  code: string;
  amount: string;
  img: string;
  paymentMethod: string;
  status: string;
  totalOrders: string;
  isSelected?: boolean;
}
export interface incomereport {
  sNo?: number;
  date: string;
  reference: string;
  category: string;
  notes: string;
  paymentMethod: string;
  amount: string;
  store: string;
  isSelected?: boolean;
}
export interface supplierreport {
  sNo?: number;
  purchaseDate: string;
  id: string;
  totalItems: string;
  paymentMethod: string;
  supplier: string;
  product: string;
  purchaseAmount: string;
  purchaseQty: string;
  paid: string;
  balance: string;
  status: string;
  img: string;
  date: string;
  purchase: string;
  reference: string;
  supplierName: string;
  amount: string;
  isSelected?: boolean;
  paidBy: string;
  value: string;
  dueAmount: string;
  paymentStatus: string;
}

// export interface returnreport {
//   sNo?: number;
//   reference: string;
//   supplierName: string;
//   amount: string;
//   paid: string;
//   dueAmount: string;
//   status: string;
//   paymentStatus: string;
// }

export interface permission {
  sNo?: number;
  modules: string;
  create: string;
  edit: string;
  delete: string;
  view: string;
  allowAll: string;
  isSelected?: boolean;
}
export interface taxReport {
  sNo: number;
  reference: string;
  supplier: string;
  date: string;
  store: string;
  amount: string;
  paymentMethod: string;
  discount: string;
  taxAmount: string;
  customer: string;
  invoiceNumber: string;
  isSelected?: boolean;
}
export interface pospurchase {
  sNo: number;
  date: string;
  reference: string;
  customer: string;
  amount: string;
 
}
export interface videocall {
  sNo: number;
  img: string;
  name: string;
}


export interface accountList {
  id: string;
  accountholder: string;
  accountno: string;
  type: string;
  balance: string;
  note: string;
  status: string
  sNo: number;
  isSelected?: boolean;
  type1?:string;
  date?:string;
  status1?:string;
}

export interface moneyTransfer {
  date: string;
  referenceNumber: string;
  fromAccount: string;
  toAccount: string;
  amount: string;
  sNo: number;
  isSelected?: boolean;
}

export interface balanceSheet {
  name: string;
  bankAccount: string;
  credit: string;
  debit: string;
  balance: string
  sNo: number;
  isSelected?: boolean;
}

export interface cashFlow {
  date: string;
  bankAccount: string;
  description: string;
  credit: string;
  debit: string;
  accountBalance: string;
  totalBalance: string;
  paymentMethod: string;
  sNo: number;
  isSelected?: boolean;
}

export interface accountStatement {
  referenceNumber: string;
  date: string;
  category: string;
  description: string;
  amount: string;
  transactionType: string;
  balance: string;
  sNo: number;
  isSelected?: boolean;
}

export interface soldStock {
  sku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  taxValue: number;
  total: number;
  img:string;
  sNo: number;
  isSelected?: boolean;
}

export interface stockHistory {
  sku: string;
  productName: string;
  initialQuantity: number;
  addedQuantity: number;
  soldQuantity: number;
  defectiveQuantity: number;
  finalQuantity: number;
  img:string;
  sNo: number;
  isSelected?: boolean;
}

export interface supplierDueReport {
  reference: string;
  id: string;
  supplier: string;
  totalAmount: string;
  paid: string;
  due: string;
  status: string;
  img: string;
    sNo: number;
  isSelected?: boolean;
}

export interface pageDetails {
  page: string;
  pageSlug: string;
  lastEdited: string;
  status: string;
  sNo: number;
  isSelected?: boolean;
}

export interface blogTag {
  sNo?: number;
  isSelected: boolean;
  Tag: string;
  CreatedDate: string;
  Status: string;
}

export interface blogCategories {
  sNo?: number;
  isSelected: boolean;
  Category: string;
  CreatedDate: string;
  Status: string;
}
export interface blogComments {
  sNo?: number;
  isSelected: boolean;
  comments:string;
  createdDate:string;
  blog:string;
  by:string;
}

export interface cities {
  sNo?: number;
  isSelected: boolean;
  CityName: string;
  StateName: string;
  CountryName: string;
  Status: string;
}

export interface lcountries {
  sNo?: number;
  isSelected?: boolean;
  CountryName?: string;
  CountryCode: string;
  Status: string;
}

export interface states {
  sNo?: number;
  isSelected?: boolean;
  StateName: string;
  CountryName: string;
  Status: string;
}
export interface testimonial {
  sNo?: number;
  isSelected?: boolean;
  author:string;
  role:string;
  content:string;
  createdDate:string;
  img:string;
}
export interface faq {
  sNo?: number;
  isSelected?: boolean;
  question:string;
  answer:string;
  category:string;
}
export interface contacts {
  sNo?: number;
  isSelected?: boolean;
  img:string;
  Name:string;
  Email:string;
  Phone:string;
  Role:string;
  Status:string;
}

export interface CompanyAccount {
  sNo?: number;
  isSelected: boolean;
  CompanyName: string;
  Email: string;
  AccountURL: string;
  Plan: string;
  CreatedDate: string; 
  Image: string;
  Status: string;
}

export interface CompanyInfo {
  sNo?: number;
  isSelected: boolean;
  CompanyName: string;
  BillCycle: string;
  PaymentMethod: string;
  Email: string;
  AccountURL: string;
  Plan: string;
  CreatedDate: string;
  ExpiringDate: string;
  Image: string;
  Status: string;
  Amount: string;
  DomainStatus: string;
  InvoiceID: string;
}

export interface PackageList {
  sNo?: number;
  isSelected: boolean;
  Plan_Name: string;
  Plan_Type: string;
  Total_Subscribers: string; // Alternatively, use number if you want a numerical type
  Price: string; // Alternatively, use number if you want to remove the "$" symbol
  Created_Date: string; // Alternatively, use Date if you want to store it as a Date object
  Status: string;
}

export interface SideBarMenu {
  showMyTab?: boolean;
  menuValue: string;
  route?: string;
  hasSubRoute?: boolean;
  showSubRoute: boolean;
  icon: string;
  base?: string;
  base2?:string;
  base3?:string;
  base4?:string;
  base5?:string;
  base7?:string;
  base8?:string;
  base9?:string;
  base10?:string;
  last1?: string;
  last?: string;
  page?: string;
  last2?: string;
  materialicons?: string;
  subMenus: SubMenu[];
  dot?: boolean;
  changeLogVersion?: boolean;
  hasSubRouteTwo?: boolean;
  page1?: string;
}

export interface SubMenu {
  menuValue: string;
  route?: string;
  base?: string;
  page?: string;
  page1?: string;
  page2?: string;
  base2?: string;
  base3?: string;
  base4?: string;
  base5?: string;
  base6?: string;
  base7?: string;
  base8?: string;
  dot?:boolean;
  currentActive?: boolean;
  hasSubRoute?: boolean;
  showSubRoute?: boolean;
  customSubmenuTwo?: boolean;
  customSubmenuThree?: boolean;
  subMenusTwo?: SubMenu[];
  subMenusThree?: SubMenu[];
  tittle?:string;
}

export interface SideBar {
  showMyTab?: boolean;
  tittle: string;
  icon?: string;
  showAsTab: boolean;
  base?:string;
  base2?:string;
  separateRoute?: boolean;
  materialicons?: string;
  menu: SideBarMenu[];
  hasSubRoute?: boolean;
}