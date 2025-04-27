import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductExpiryReportComponent } from './product-expiry-report.component';

describe('ProductExpiryReportComponent', () => {
  let component: ProductExpiryReportComponent;
  let fixture: ComponentFixture<ProductExpiryReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductExpiryReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductExpiryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
