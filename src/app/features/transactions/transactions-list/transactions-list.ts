import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransactionsService } from '../service/transactions.service';
import { CategoriesService } from '../../categories/services/categories.service';
import { Transaction, TransactionFilter } from '../../../core/models/transaction.model';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-transactions-list',
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './transactions-list.html',
  styleUrl: './transactions-list.css',
  standalone: true
})
export class TransactionsList implements OnInit {
  transactions: Transaction[] = [];
  categories: Category[] = [];
  isLoading = false;
  error: string | null = null;

  // Filters
  filter: TransactionFilter = {};
  selectedType: 'all' | 'expense' | 'income' = 'all';
  selectedCategoryId: string = 'all';
  startDateStr: string = '';
  endDateStr: string = '';

  constructor(
    private transactionsService: TransactionsService,
    private categoriesService: CategoriesService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object) { }

  public ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCategories();
      this.loadTransactions();

      // Subscribe to updates
      this.transactionsService.refresh$.subscribe(() => {
        this.loadTransactions();
      });
    }
  }

  public loadCategories(): void {
    this.categoriesService.getCategories().subscribe(cats => {
      this.categories = cats;
    });
  }

  public loadTransactions(): void {
    this.isLoading = true;
    this.error = null;

    // Prepare filter
    const activeFilter: TransactionFilter = {};

    if (this.selectedType !== 'all') {
      activeFilter.type = this.selectedType;
    }

    if (this.selectedCategoryId !== 'all') {
      activeFilter.categoryId = this.selectedCategoryId;
    }

    if (this.startDateStr) {
      activeFilter.startDate = new Date(this.startDateStr);
    }

    if (this.endDateStr) {
      activeFilter.endDate = new Date(this.endDateStr);
    }

    this.transactionsService.getTransactions(activeFilter).subscribe({
      next: (data) => {
        this.transactions = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar transacciones';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  public onFilterChange(): void {
    this.loadTransactions();
  }

  public clearFilters(): void {
    this.selectedType = 'all';
    this.selectedCategoryId = 'all';
    this.startDateStr = '';
    this.endDateStr = '';
    this.loadTransactions();
  }

  public onCreateTransaction(): void {
    this.router.navigate(['/transactions/new']);
  }

  public onEditTransaction(id: string): void {
    this.router.navigate(['/transactions/edit', id]);
  }

  public onDeleteTransaction(transaction: Transaction): void {
    if (confirm(`¿Eliminar transacción de ${transaction.amount}?`)) {
      this.transactionsService.deleteTransaction(transaction.id).subscribe({
        error: (err) => console.error(err)
      });
    }
  }

  public getTotalAmount(): number {
    return this.transactions.reduce((sum, t) => {
      const amount = Number(t.amount);
      return t.type === 'income' ? sum + amount : sum - amount;
    }, 0);
  }
}