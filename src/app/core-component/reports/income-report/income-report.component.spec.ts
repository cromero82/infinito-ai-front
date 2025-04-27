import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeReportComponent } from './income-report.component';

describe('IncomeReportComponent', () => {
  let component: IncomeReportComponent;
  let fixture: ComponentFixture<IncomeReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IncomeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
