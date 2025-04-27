import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSelect2Component } from './form-select-2.component';

describe('FormSelect2Component', () => {
  let component: FormSelect2Component;
  let fixture: ComponentFixture<FormSelect2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormSelect2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormSelect2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
