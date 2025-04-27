import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoStepVerification2Component } from './two-step-verification-2.component';

describe('TwoStepVerification2Component', () => {
  let component: TwoStepVerification2Component;
  let fixture: ComponentFixture<TwoStepVerification2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoStepVerification2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TwoStepVerification2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
