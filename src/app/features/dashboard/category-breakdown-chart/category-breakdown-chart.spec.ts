import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryBreakdownChart } from './category-breakdown-chart';

describe('CategoryBreakdownChart', () => {
  let component: CategoryBreakdownChart;
  let fixture: ComponentFixture<CategoryBreakdownChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryBreakdownChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryBreakdownChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
