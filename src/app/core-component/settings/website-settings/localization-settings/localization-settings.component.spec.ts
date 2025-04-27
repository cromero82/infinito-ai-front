import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalizationSettingsComponent } from './localization-settings.component';

describe('LocalizationSettingsComponent', () => {
  let component: LocalizationSettingsComponent;
  let fixture: ComponentFixture<LocalizationSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocalizationSettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LocalizationSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
