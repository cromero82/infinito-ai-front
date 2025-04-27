import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiBadgesComponent } from './ui-badges.component';

describe('UiBadgesComponent', () => {
  let component: UiBadgesComponent;
  let fixture: ComponentFixture<UiBadgesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiBadgesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiBadgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
