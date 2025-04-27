import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconThemifyComponent } from './icon-themify.component';

describe('IconThemifyComponent', () => {
  let component: IconThemifyComponent;
  let fixture: ComponentFixture<IconThemifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconThemifyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconThemifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
