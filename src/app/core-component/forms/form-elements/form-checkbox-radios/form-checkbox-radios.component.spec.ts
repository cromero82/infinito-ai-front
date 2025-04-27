import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCheckboxRadiosComponent } from './form-checkbox-radios.component';

describe('FormCheckboxRadiosComponent', () => {
  let component: FormCheckboxRadiosComponent;
  let fixture: ComponentFixture<FormCheckboxRadiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormCheckboxRadiosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormCheckboxRadiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
