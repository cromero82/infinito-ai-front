import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { apiResultFormat } from '../../models/models';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  public getCountryList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/countrys.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getExpenseCategory(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/expense-category.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getExpenseList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/expense-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getCustomerList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/customerList.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getQuotationList(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/quotation-list.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getTransferList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/transferList.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }

  public getUserList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/userList.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }

 
  public getProductList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/product-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getCategoryList(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/category-list.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getSubcategoryList(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/subcategoryList.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getBrandList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/brand-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }

  public getPurchaseList(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/purchase-list.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getSalesReturnList(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/salesreturnLists.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPurchaseReturnList(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/purchaseReturnList.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getSupplierList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/supplierList.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPeopleUserList(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/peopleUserList.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  
  public getStateList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/stateList.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPurchaseOrderReport(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/purchase-order-report.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPurchaseReport(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/purchase-report.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPaymentSettings(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/paymentSettings.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getCurrencySettings(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/currency-setting.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getGroupPermission(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/groupPermission.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getTaxRates(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/taxRates.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getSupplierReport1(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/supplierReport1.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getSupplierReport2(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/supplierReport2.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getSupplierReport3(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/supplierReport3.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getSalesListModal(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/salesListModal.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPos1(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/pos1.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPos2(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/pos2.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPos3(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/pos3.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getEditPermission(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/editpermisssion.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getEvents() {
    return this.http.get('assets/JSON/scheduleevents.json').pipe(
      map((res) => {
        return res;
      })
    );
  }

  public getDataTable() {
    return this.http.get<apiResultFormat>('assets/JSON/datatables.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getDeleteAccount(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/delete-account.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getCoupons(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/coupons.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getDiscountPlan(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/discount-plan.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getDiscount(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/discount.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getDesignation(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/designation.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getDepartment(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/department-list.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getAttendanceAdmin(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/attendance-admin.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getAttendanceEmployee(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/attendance-employee.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getBarcode(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/barcode.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getExpiredproduct(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/expired-products.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getEmployeeList(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/employee-list.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getCustomfield(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/custom-field.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getBankSettingsList(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/bank-settings-list.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getFile(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/files.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getHolidays(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/holidays.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getLanguageSetting(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/language-setting.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getCallHistory(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/call-history.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getExpiredProduct(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/expired-product.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getUnit(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/units.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getFileShared(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/file-shared.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getCountry(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/coutries.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getRolesPermissions(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/roles-permissions.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getState(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/state.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getCustomer(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/customers.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPrinterSetting(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/printer-setting.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getSalesList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/sales-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getShift(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/shift.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getLowStocks(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/low-stocks.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getLowStocks2(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/low-stocks.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getManageStocks(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/manage-stocks.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getWarranty(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/warranty.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPayrollList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/payroll-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getSalesReport(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/sales-report.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getSalesReturn(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/sales-return.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getVarriantAttributes(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/varriant-attributes.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getStocks(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/stock-transfer.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getStockadjustment(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/stock-adjustment.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
}
  public getUsers(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/users.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getQrCode(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/qrcode.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getLeavesAdmin(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/leaves-admin.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getLeavesType(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/leaves-type.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getLeavesEmployee(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/leaves-employee.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getStoreList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/store-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getSubCategories(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/sub-categories.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getSupplier(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/suppliers.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getWareHouse(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/warehouse.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPurchaseReturns(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/purchase-returns.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getTaxRate(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/tax-rates.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getInventoryReport(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/inventory-report.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getInvoiceReport(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/invoice-report.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getexpenseReport(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/expense-report.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getCustomerReport(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/customer-report.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getIncomeReport(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/income-report.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getSupplierReport(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/supplier-report.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getSupplierpaymentReport(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/payment-report.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getSupplierReturnReport(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/return-report.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPermission(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/permission.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getTaxReport1(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/tax-reports1.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getTaxReport2(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/JSON/tax-reports2.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPosPurchase(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/pos-purchase.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getSalesInvoice(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/sales-invoice.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getIncome(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/income.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getAccountList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/account-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getAccountStatement(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/account-statement.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getBalanceSheet(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/balance-sheet.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getCashFlow(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/cash-flow.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getMoneyTransfer(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/money-transfer.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getBillers(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/billers.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getStockHistory(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/stock-history.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getSoldStock(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/sold-stock.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getSupplierDueReport(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/supplier-due-report.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getCustomerDueReport(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/customer-due-report.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPages(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/pages.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getBlogTag(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/blog-tag.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    )
  }
  public getBlogCategories(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/blog-categories.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    )
  }
  public getBlogComments(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/blog-comments.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    )
  }
  public getCountries(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/countries.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    )
  }

  public getCities(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/cities.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    )
  }

  public getStates(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/states.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    )
  }
  public getTestimonial(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/testimonial.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    )
  }
  public getFaq(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/faq.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    )
  }
  public getContacts(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/contacts.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    )
  }
  public getSubscription(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/subscription.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPackage(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/package-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getCompanies(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/JSON/companies.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
}
