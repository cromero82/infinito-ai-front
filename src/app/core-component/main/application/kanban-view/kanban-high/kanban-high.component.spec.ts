import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanHighComponent } from './kanban-high.component';

describe('KanbanHighComponent', () => {
  let component: KanbanHighComponent;
  let fixture: ComponentFixture<KanbanHighComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KanbanHighComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KanbanHighComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
