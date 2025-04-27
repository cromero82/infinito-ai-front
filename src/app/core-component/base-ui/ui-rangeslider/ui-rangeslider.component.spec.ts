import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiRangesliderComponent } from './ui-rangeslider.component';

describe('UiRangesliderComponent', () => {
  let component: UiRangesliderComponent;
  let fixture: ComponentFixture<UiRangesliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiRangesliderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiRangesliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
