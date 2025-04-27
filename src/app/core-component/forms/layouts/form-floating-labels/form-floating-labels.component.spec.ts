import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFloatingLabelsComponent } from './form-floating-labels.component';

describe('FormFloatingLabelsComponent', () => {
  let component: FormFloatingLabelsComponent;
  let fixture: ComponentFixture<FormFloatingLabelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFloatingLabelsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormFloatingLabelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
