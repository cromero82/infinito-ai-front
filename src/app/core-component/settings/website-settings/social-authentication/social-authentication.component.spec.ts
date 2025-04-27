import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialAuthenticationComponent } from './social-authentication.component';

describe('SocialAuthenticationComponent', () => {
  let component: SocialAuthenticationComponent;
  let fixture: ComponentFixture<SocialAuthenticationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialAuthenticationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SocialAuthenticationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
