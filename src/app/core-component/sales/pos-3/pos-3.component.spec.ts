import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pos3Component } from './pos-3.component';

describe('Pos3Component', () => {
  let component: Pos3Component;
  let fixture: ComponentFixture<Pos3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Pos3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pos3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
