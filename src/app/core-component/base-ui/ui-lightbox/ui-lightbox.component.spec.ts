import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiLightboxComponent } from './ui-lightbox.component';

describe('UiLightboxComponent', () => {
  let component: UiLightboxComponent;
  let fixture: ComponentFixture<UiLightboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiLightboxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiLightboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
