import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerDueReportComponent } from './customer-due-report.component';

describe('CustomerDueReportComponent', () => {
  let component: CustomerDueReportComponent;
  let fixture: ComponentFixture<CustomerDueReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerDueReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerDueReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
