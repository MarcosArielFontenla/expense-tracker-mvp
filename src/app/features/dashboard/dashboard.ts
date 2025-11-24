import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { TransactionsService } from '../transactions/service/transactions.service';
import { Transaction, MonthlySummary } from '../../core/models/transaction.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  standalone: true
})
export class Dashboard implements OnInit, AfterViewInit {
  @ViewChild('breakdownChart') breakdownChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;

  summary: MonthlySummary | null = null;
  recentTransactions: Transaction[] = [];
  isLoading = false;

  private breakdownChart: Chart | null = null;
  private trendChart: Chart | null = null;

  constructor(
    private transactionsService: TransactionsService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object) { }

  public ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDashboardData();

      this.transactionsService.refresh$.subscribe(() => {
        this.loadDashboardData();
      });
    }
  }

  public ngAfterViewInit(): void {
  }

  public loadDashboardData(): void {
    this.isLoading = true;
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 1. Get Monthly Summary
    this.transactionsService.getMonthlySummary(currentMonth, currentYear).subscribe(summary => {
      this.summary = summary;
    });

    // 2. Get Recent Transactions
    this.transactionsService.getTransactions().subscribe(transactions => {
      this.recentTransactions = transactions.slice(0, 5);
      this.isLoading = false;

      // 3. Update Charts
      setTimeout(() => {
        this.updateBreakdownChart(transactions);
        this.updateTrendChart(transactions);
      }, 0);
    });
  }

  public updateBreakdownChart(transactions: Transaction[]): void {
    if (!this.breakdownChartRef) return;

    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals = new Map<string, number>();
    const categoryColors = new Map<string, string>();

    expenses.forEach(t => {
      const catName = t.category?.name || 'Otros';
      const current = categoryTotals.get(catName) || 0;
      categoryTotals.set(catName, current + t.amount);

      if (t.category?.color) {
        categoryColors.set(catName, t.category.color);
      }
    });

    const labels = Array.from(categoryTotals.keys());
    const data = Array.from(categoryTotals.values());
    const colors = labels.map(l => categoryColors.get(l) || '#9ca3af');

    if (this.breakdownChart) {
      this.breakdownChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, font: { size: 11 } }
          }
        },
        cutout: '70%'
      } as any
    };

    this.breakdownChart = new Chart(this.breakdownChartRef.nativeElement, config);
  }

  public updateTrendChart(transactions: Transaction[]): void {
    if (!this.trendChartRef) return;

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().substring(0, 10);
    }).reverse();

    const incomeData = last7Days.map(date => {
      return transactions
        .filter(t => t.type === 'income' && t.date.toString().startsWith(date))
        .reduce((sum, t) => sum + t.amount, 0);
    });

    const expenseData = last7Days.map(date => {
      return transactions
        .filter(t => t.type === 'expense' && t.date.toString().startsWith(date))
        .reduce((sum, t) => sum + t.amount, 0);
    });

    const labels = last7Days.map(d => new Date(d).toLocaleDateString('es-ES', { weekday: 'short' }));

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: incomeData,
            backgroundColor: '#22c55e',
            borderRadius: 4
          },
          {
            label: 'Gastos',
            data: expenseData,
            backgroundColor: '#ef4444',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { display: false } },
          x: { grid: { display: false } }
        }
      }
    };

    this.trendChart = new Chart(this.trendChartRef.nativeElement, config);
  }

  public onNewTransaction(): void {
    this.router.navigate(['/transactions/new']);
  }

  public onViewAllTransactions(): void {
    this.router.navigate(['/transactions']);
  }
}