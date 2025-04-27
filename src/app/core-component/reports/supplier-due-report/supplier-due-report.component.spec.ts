import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierDueReportComponent } from './supplier-due-report.component';

describe('SupplierDueReportComponent', () => {
  let component: SupplierDueReportComponent;
  let fixture: ComponentFixture<SupplierDueReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierDueReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierDueReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
