import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonCounter2Component } from './common-counter-2.component';

describe('CommonCounter2Component', () => {
  let component: CommonCounter2Component;
  let fixture: ComponentFixture<CommonCounter2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonCounter2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonCounter2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
