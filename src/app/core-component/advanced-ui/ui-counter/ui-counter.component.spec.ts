import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiCounterComponent } from './ui-counter.component';

describe('UiCounterComponent', () => {
  let component: UiCounterComponent;
  let fixture: ComponentFixture<UiCounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiCounterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiCounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
