import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankSettingsListComponent } from './bank-settings-list.component';

describe('BankSettingsListComponent', () => {
  let component: BankSettingsListComponent;
  let fixture: ComponentFixture<BankSettingsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankSettingsListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BankSettingsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
