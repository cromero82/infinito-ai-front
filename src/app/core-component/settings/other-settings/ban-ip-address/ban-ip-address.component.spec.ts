import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BanIpAddressComponent } from './ban-ip-address.component';

describe('BanIpAddressComponent', () => {
  let component: BanIpAddressComponent;
  let fixture: ComponentFixture<BanIpAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BanIpAddressComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BanIpAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
