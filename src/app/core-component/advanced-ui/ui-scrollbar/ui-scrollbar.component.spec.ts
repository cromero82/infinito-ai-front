import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiScrollbarComponent } from './ui-scrollbar.component';

describe('UiScrollbarComponent', () => {
  let component: UiScrollbarComponent;
  let fixture: ComponentFixture<UiScrollbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiScrollbarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiScrollbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
