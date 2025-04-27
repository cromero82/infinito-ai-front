import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileFavouritesComponent } from './file-favourites.component';

describe('FileFavouritesComponent', () => {
  let component: FileFavouritesComponent;
  let fixture: ComponentFixture<FileFavouritesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileFavouritesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileFavouritesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
