import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconFlagComponent } from './icon-flag.component';

describe('IconFlagComponent', () => {
  let component: IconFlagComponent;
  let fixture: ComponentFixture<IconFlagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconFlagComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
