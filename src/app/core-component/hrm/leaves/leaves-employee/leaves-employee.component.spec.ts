import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeavesEmployeeComponent } from './leaves-employee.component';

describe('LeavesEmployeeComponent', () => {
  let component: LeavesEmployeeComponent;
  let fixture: ComponentFixture<LeavesEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeavesEmployeeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LeavesEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
