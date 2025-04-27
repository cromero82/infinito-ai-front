import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiBordersComponent } from './ui-borders.component';

describe('UiBordersComponent', () => {
  let component: UiBordersComponent;
  let fixture: ComponentFixture<UiBordersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiBordersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiBordersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
