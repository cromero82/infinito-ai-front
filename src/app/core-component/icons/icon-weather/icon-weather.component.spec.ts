import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconWeatherComponent } from './icon-weather.component';

describe('IconWeatherComponent', () => {
  let component: IconWeatherComponent;
  let fixture: ComponentFixture<IconWeatherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconWeatherComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconWeatherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
