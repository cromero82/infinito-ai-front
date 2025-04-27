import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VarriantAttributesComponent } from './varriant-attributes.component';

describe('VarriantAttributesComponent', () => {
  let component: VarriantAttributesComponent;
  let fixture: ComponentFixture<VarriantAttributesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VarriantAttributesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VarriantAttributesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
