import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankSettingsGridComponent } from './bank-settings-grid.component';

describe('BankSettingsGridComponent', () => {
  let component: BankSettingsGridComponent;
  let fixture: ComponentFixture<BankSettingsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankSettingsGridComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BankSettingsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
