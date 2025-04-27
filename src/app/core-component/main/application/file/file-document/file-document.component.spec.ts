import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileDocumentComponent } from './file-document.component';

describe('FileDocumentComponent', () => {
  let component: FileDocumentComponent;
  let fixture: ComponentFixture<FileDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileDocumentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
