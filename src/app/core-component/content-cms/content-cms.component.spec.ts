import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentCmsComponent } from './content-cms.component';

describe('ContentCmsComponent', () => {
  let component: ContentCmsComponent;
  let fixture: ComponentFixture<ContentCmsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContentCmsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentCmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
