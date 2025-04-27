import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiNavTabsComponent } from './ui-nav-tabs.component';

describe('UiNavTabsComponent', () => {
  let component: UiNavTabsComponent;
  let fixture: ComponentFixture<UiNavTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiNavTabsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiNavTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
