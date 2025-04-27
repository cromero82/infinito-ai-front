import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Success2Component } from './success-2.component';

describe('Success2Component', () => {
  let component: Success2Component;
  let fixture: ComponentFixture<Success2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Success2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Success2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
