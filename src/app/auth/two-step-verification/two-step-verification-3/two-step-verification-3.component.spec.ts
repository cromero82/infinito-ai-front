import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoStepVerification3Component } from './two-step-verification-3.component';

describe('TwoStepVerification3Component', () => {
  let component: TwoStepVerification3Component;
  let fixture: ComponentFixture<TwoStepVerification3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoStepVerification3Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TwoStepVerification3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
