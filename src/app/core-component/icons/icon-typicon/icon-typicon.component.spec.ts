import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconTypiconComponent } from './icon-typicon.component';

describe('IconTypiconComponent', () => {
  let component: IconTypiconComponent;
  let fixture: ComponentFixture<IconTypiconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconTypiconComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconTypiconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
