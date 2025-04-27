import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiTextEditorComponent } from './ui-text-editor.component';

describe('UiTextEditorComponent', () => {
  let component: UiTextEditorComponent;
  let fixture: ComponentFixture<UiTextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiTextEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiTextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
