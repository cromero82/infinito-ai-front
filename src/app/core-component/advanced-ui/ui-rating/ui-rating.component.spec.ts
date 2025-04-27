import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiRatingComponent } from './ui-rating.component';

describe('UiRatingComponent', () => {
  let component: UiRatingComponent;
  let fixture: ComponentFixture<UiRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiRatingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
