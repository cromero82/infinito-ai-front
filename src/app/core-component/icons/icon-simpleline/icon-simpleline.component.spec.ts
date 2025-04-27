import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconSimplelineComponent } from './icon-simpleline.component';

describe('IconSimplelineComponent', () => {
  let component: IconSimplelineComponent;
  let fixture: ComponentFixture<IconSimplelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconSimplelineComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconSimplelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
