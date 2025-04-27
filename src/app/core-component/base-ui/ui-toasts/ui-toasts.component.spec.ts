import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiToastsComponent } from './ui-toasts.component';

describe('UiToastsComponent', () => {
  let component: UiToastsComponent;
  let fixture: ComponentFixture<UiToastsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiToastsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiToastsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
