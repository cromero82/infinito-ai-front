import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pos4Component } from './pos-4.component';

describe('Pos4Component', () => {
  let component: Pos4Component;
  let fixture: ComponentFixture<Pos4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Pos4Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pos4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
