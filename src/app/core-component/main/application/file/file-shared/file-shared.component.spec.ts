import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileSharedComponent } from './file-shared.component';

describe('FileSharedComponent', () => {
  let component: FileSharedComponent;
  let fixture: ComponentFixture<FileSharedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileSharedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileSharedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
