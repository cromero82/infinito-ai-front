import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceEmployeeComponent } from './attendance-employee.component';

describe('AttendanceEmployeeComponent', () => {
  let component: AttendanceEmployeeComponent;
  let fixture: ComponentFixture<AttendanceEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceEmployeeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendanceEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
