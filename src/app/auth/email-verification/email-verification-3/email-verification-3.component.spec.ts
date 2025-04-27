import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailVerification3Component } from './email-verification-3.component';

describe('EmailVerification3Component', () => {
  let component: EmailVerification3Component;
  let fixture: ComponentFixture<EmailVerification3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailVerification3Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmailVerification3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
