import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pos2Component } from './pos-2.component';

describe('Pos2Component', () => {
  let component: Pos2Component;
  let fixture: ComponentFixture<Pos2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Pos2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pos2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
