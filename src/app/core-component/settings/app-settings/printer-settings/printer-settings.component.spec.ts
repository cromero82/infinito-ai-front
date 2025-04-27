import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterSettingsComponent } from './printer-settings.component';

describe('PrinterSettingsComponent', () => {
  let component: PrinterSettingsComponent;
  let fixture: ComponentFixture<PrinterSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrinterSettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrinterSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
