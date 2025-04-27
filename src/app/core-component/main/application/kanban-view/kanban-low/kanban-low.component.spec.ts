import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanLowComponent } from './kanban-low.component';

describe('KanbanLowComponent', () => {
  let component: KanbanLowComponent;
  let fixture: ComponentFixture<KanbanLowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KanbanLowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KanbanLowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
