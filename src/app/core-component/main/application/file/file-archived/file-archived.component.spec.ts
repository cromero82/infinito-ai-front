import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileArchivedComponent } from './file-archived.component';

describe('FileArchivedComponent', () => {
  let component: FileArchivedComponent;
  let fixture: ComponentFixture<FileArchivedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileArchivedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileArchivedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
