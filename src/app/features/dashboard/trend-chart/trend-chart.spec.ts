import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendChart } from './trend-chart';

describe('TrendChart', () => {
  let component: TrendChart;
  let fixture: ComponentFixture<TrendChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrendChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
