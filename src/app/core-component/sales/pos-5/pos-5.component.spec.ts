import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pos5Component } from './pos-5.component';

describe('Pos5Component', () => {
  let component: Pos5Component;
  let fixture: ComponentFixture<Pos5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Pos5Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pos5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
