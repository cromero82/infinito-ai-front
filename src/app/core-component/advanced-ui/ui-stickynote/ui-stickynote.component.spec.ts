import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiStickynoteComponent } from './ui-stickynote.component';

describe('UiStickynoteComponent', () => {
  let component: UiStickynoteComponent;
  let fixture: ComponentFixture<UiStickynoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiStickynoteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiStickynoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
