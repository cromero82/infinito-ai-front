import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconBootstrapComponent } from './icon-bootstrap.component';

describe('IconBootstrapComponent', () => {
  let component: IconBootstrapComponent;
  let fixture: ComponentFixture<IconBootstrapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IconBootstrapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconBootstrapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
