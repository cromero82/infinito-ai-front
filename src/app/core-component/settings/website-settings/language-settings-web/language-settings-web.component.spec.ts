import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageSettingsWebComponent } from './language-settings-web.component';

describe('LanguageSettingsWebComponent', () => {
  let component: LanguageSettingsWebComponent;
  let fixture: ComponentFixture<LanguageSettingsWebComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSettingsWebComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LanguageSettingsWebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
