import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconRemixComponent } from './icon-remix.component';

describe('IconRemixComponent', () => {
  let component: IconRemixComponent;
  let fixture: ComponentFixture<IconRemixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IconRemixComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconRemixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
