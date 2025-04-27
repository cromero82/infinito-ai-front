import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconMaterialComponent } from './icon-material.component';

describe('IconMaterialComponent', () => {
  let component: IconMaterialComponent;
  let fixture: ComponentFixture<IconMaterialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconMaterialComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
