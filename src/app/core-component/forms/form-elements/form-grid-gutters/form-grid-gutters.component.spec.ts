import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormGridGuttersComponent } from './form-grid-gutters.component';

describe('FormGridGuttersComponent', () => {
  let component: FormGridGuttersComponent;
  let fixture: ComponentFixture<FormGridGuttersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormGridGuttersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormGridGuttersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
