import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiPopoversComponent } from './ui-popovers.component';

describe('UiPopoversComponent', () => {
  let component: UiPopoversComponent;
  let fixture: ComponentFixture<UiPopoversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiPopoversComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiPopoversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
