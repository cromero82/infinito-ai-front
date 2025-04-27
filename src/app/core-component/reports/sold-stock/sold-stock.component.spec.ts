import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoldStockComponent } from './sold-stock.component';

describe('SoldStockComponent', () => {
  let component: SoldStockComponent;
  let fixture: ComponentFixture<SoldStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoldStockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoldStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
