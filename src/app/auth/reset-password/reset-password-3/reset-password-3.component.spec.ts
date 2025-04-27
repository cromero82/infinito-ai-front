import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPassword3Component } from './reset-password-3.component';

describe('ResetPassword3Component', () => {
  let component: ResetPassword3Component;
  let fixture: ComponentFixture<ResetPassword3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPassword3Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResetPassword3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
