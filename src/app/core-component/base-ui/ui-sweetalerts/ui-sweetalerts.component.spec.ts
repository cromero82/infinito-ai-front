import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiSweetalertsComponent } from './ui-sweetalerts.component';

describe('UiSweetalertsComponent', () => {
  let component: UiSweetalertsComponent;
  let fixture: ComponentFixture<UiSweetalertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiSweetalertsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiSweetalertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
