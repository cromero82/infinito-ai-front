import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Success3Component } from './success-3.component';

describe('Success3Component', () => {
  let component: Success3Component;
  let fixture: ComponentFixture<Success3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Success3Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Success3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
