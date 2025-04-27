import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtpSettingsComponent } from './otp-settings.component';

describe('OtpSettingsComponent', () => {
  let component: OtpSettingsComponent;
  let fixture: ComponentFixture<OtpSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpSettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OtpSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
