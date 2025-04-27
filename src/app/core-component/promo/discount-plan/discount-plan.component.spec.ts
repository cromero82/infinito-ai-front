import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountPlanComponent } from './discount-plan.component';

describe('DiscountPlanComponent', () => {
  let component: DiscountPlanComponent;
  let fixture: ComponentFixture<DiscountPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscountPlanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscountPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
