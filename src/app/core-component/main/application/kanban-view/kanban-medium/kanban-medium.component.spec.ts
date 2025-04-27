import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanMediumComponent } from './kanban-medium.component';

describe('KanbanMediumComponent', () => {
  let component: KanbanMediumComponent;
  let fixture: ComponentFixture<KanbanMediumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KanbanMediumComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KanbanMediumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
