import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconPe7Component } from './icon-pe7.component';

describe('IconPe7Component', () => {
  let component: IconPe7Component;
  let fixture: ComponentFixture<IconPe7Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconPe7Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconPe7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
