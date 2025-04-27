import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarThreeComponent } from './sidebar-three.component';

describe('SidebarThreeComponent', () => {
  let component: SidebarThreeComponent;
  let fixture: ComponentFixture<SidebarThreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SidebarThreeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarThreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
