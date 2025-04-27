import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiSortableComponent } from './ui-sortable.component';

describe('UiSortableComponent', () => {
  let component: UiSortableComponent;
  let fixture: ComponentFixture<UiSortableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiSortableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UiSortableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
