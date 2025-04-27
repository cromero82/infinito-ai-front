import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiRibbonComponent } from './ui-ribbon.component';

describe('UiRibbonComponent', () => {
  let component: UiRibbonComponent;
  let fixture: ComponentFixture<UiRibbonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiRibbonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiRibbonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
