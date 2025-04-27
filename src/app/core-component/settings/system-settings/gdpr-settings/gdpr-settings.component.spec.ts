import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GdprSettingsComponent } from './gdpr-settings.component';

describe('GdprSettingsComponent', () => {
  let component: GdprSettingsComponent;
  let fixture: ComponentFixture<GdprSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GdprSettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GdprSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
