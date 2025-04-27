import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartApexComponent } from './chart-apex.component';

describe('ChartApexComponent', () => {
  let component: ChartApexComponent;
  let fixture: ComponentFixture<ChartApexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChartApexComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartApexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
