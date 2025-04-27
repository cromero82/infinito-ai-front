import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFileuploadComponent } from './form-fileupload.component';

describe('FormFileuploadComponent', () => {
  let component: FormFileuploadComponent;
  let fixture: ComponentFixture<FormFileuploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormFileuploadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormFileuploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
