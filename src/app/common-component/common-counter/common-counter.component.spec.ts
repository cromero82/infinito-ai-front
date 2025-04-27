import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonCounterComponent } from './common-counter.component';

describe('CommonCounterComponent', () => {
  let component: CommonCounterComponent;
  let fixture: ComponentFixture<CommonCounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonCounterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonCounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
