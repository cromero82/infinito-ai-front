import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiAvatarComponent } from './ui-avatar.component';

describe('UiAvatarComponent', () => {
  let component: UiAvatarComponent;
  let fixture: ComponentFixture<UiAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UiAvatarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UiAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
