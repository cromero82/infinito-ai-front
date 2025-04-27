import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileRecentComponent } from './file-recent.component';

describe('FileRecentComponent', () => {
  let component: FileRecentComponent;
  let fixture: ComponentFixture<FileRecentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileRecentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileRecentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
