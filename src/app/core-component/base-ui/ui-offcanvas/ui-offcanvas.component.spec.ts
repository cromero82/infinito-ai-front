import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiOffcanvasComponent } from './ui-offcanvas.component';

describe('UiOffcanvasComponent', () => {
  let component: UiOffcanvasComponent;
  let fixture: ComponentFixture<UiOffcanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiOffcanvasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiOffcanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
