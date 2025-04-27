import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailVerification2Component } from './email-verification-2.component';

describe('EmailVerification2Component', () => {
  let component: EmailVerification2Component;
  let fixture: ComponentFixture<EmailVerification2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailVerification2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmailVerification2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
