import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentGatewaySettingsComponent } from './payment-gateway-settings.component';

describe('PaymentGatewaySettingsComponent', () => {
  let component: PaymentGatewaySettingsComponent;
  let fixture: ComponentFixture<PaymentGatewaySettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentGatewaySettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PaymentGatewaySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
