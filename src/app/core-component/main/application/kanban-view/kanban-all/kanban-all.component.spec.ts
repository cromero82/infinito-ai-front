import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanAllComponent } from './kanban-all.component';

describe('KanbanAllComponent', () => {
  let component: KanbanAllComponent;
  let fixture: ComponentFixture<KanbanAllComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KanbanAllComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KanbanAllComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
