import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductQuantityAlertComponent } from './product-quantity-alert.component';

describe('ProductQuantityAlertComponent', () => {
  let component: ProductQuantityAlertComponent;
  let fixture: ComponentFixture<ProductQuantityAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductQuantityAlertComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductQuantityAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
