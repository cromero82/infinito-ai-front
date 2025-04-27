import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiClipboardComponent } from './ui-clipboard.component';

describe('UiClipboardComponent', () => {
  let component: UiClipboardComponent;
  let fixture: ComponentFixture<UiClipboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiClipboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiClipboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
