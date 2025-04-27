import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiProgressComponent } from './ui-progress.component';

describe('UiProgressComponent', () => {
  let component: UiProgressComponent;
  let fixture: ComponentFixture<UiProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiProgressComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
