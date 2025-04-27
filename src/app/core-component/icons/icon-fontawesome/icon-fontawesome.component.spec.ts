import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconFontawesomeComponent } from './icon-fontawesome.component';

describe('IconFontawesomeComponent', () => {
  let component: IconFontawesomeComponent;
  let fixture: ComponentFixture<IconFontawesomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconFontawesomeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconFontawesomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
