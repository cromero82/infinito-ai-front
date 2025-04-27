import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileManagerDeletedComponent } from './file-manager-deleted.component';

describe('FileManagerDeletedComponent', () => {
  let component: FileManagerDeletedComponent;
  let fixture: ComponentFixture<FileManagerDeletedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileManagerDeletedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileManagerDeletedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
