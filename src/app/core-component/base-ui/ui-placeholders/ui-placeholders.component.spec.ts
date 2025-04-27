import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiPlaceholdersComponent } from './ui-placeholders.component';

describe('UiPlaceholdersComponent', () => {
  let component: UiPlaceholdersComponent;
  let fixture: ComponentFixture<UiPlaceholdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiPlaceholdersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiPlaceholdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
