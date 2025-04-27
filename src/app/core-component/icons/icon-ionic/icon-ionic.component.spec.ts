import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconIonicComponent } from './icon-ionic.component';

describe('IconIonicComponent', () => {
  let component: IconIonicComponent;
  let fixture: ComponentFixture<IconIonicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconIonicComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconIonicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
