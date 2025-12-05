import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransactionsService } from '../service/transactions.service';
import { CategoriesService } from '../../categories/services/categories.service';
import { Transaction, TransactionFilter } from '../../../core/models/transaction.model';
import { Category } from '../../../core/models/category.model';
import { AuthService } from '../../../core/services/auth.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-transactions-list',
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './transactions-list.html',
  styleUrl: './transactions-list.css',
  standalone: true
})
export class TransactionsList implements OnInit {
  transactions: Transaction[] = [];
  totalTransactions: number = 0;
  categories: Category[] = [];
  isLoading = false;
  error: string | null = null;
  userCurrency: string = 'USD';

  // Filters
  filter: TransactionFilter = {};
  selectedType: 'all' | 'expense' | 'income' = 'all';
  selectedCategoryId: string = 'all';
  startDateStr: string = '';
  endDateStr: string = '';

  // Advanced filters
  searchQuery: string = '';
  minAmount: number | null = null;
  maxAmount: number | null = null;

  // Sorting
  sortBy: 'date' | 'amount' | 'createdAt' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Quick filters
  quickFilter: 'all' | 'today' | 'week' | 'month' = 'all';

  // Search debounce
  private searchSubject = new Subject<string>();

  constructor(
    private transactionsService: TransactionsService,
    private categoriesService: CategoriesService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object) { }

  public ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Get user currency
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.userCurrency = user.currency || 'USD';
        }
      });

      this.loadCategories();
      this.loadTransactions();

      // Subscribe to updates
      this.transactionsService.refresh$.subscribe(() => {
        this.loadTransactions();
      });

      // Search debounce
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
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

    // Advanced filters
    if (this.searchQuery.trim()) {
      activeFilter.search = this.searchQuery.trim();
    }

    if (this.minAmount !== null && this.minAmount !== undefined) {
      activeFilter.minAmount = this.minAmount;
    }

    if (this.maxAmount !== null && this.maxAmount !== undefined) {
      activeFilter.maxAmount = this.maxAmount;
    }

    // Sorting
    activeFilter.sortBy = this.sortBy;
    activeFilter.sortOrder = this.sortOrder;

    this.transactionsService.getTransactions(activeFilter).subscribe({
      next: (data) => {
        this.transactions = data;
        this.totalTransactions = data.length;
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
    this.quickFilter = 'all';
    this.loadTransactions();
  }

  public onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  public onAmountFilterChange(): void {
    this.loadTransactions();
  }

  public setQuickFilter(filter: 'all' | 'today' | 'week' | 'month'): void {
    this.quickFilter = filter;
    const now = new Date();

    switch (filter) {
      case 'today':
        this.startDateStr = this.formatDateForInput(now);
        this.endDateStr = this.formatDateForInput(now);
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        this.startDateStr = this.formatDateForInput(startOfWeek);
        this.endDateStr = this.formatDateForInput(now);
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        this.startDateStr = this.formatDateForInput(startOfMonth);
        this.endDateStr = this.formatDateForInput(now);
        break;
      case 'all':
      default:
        this.startDateStr = '';
        this.endDateStr = '';
        break;
    }

    this.loadTransactions();
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  public toggleSort(field: 'date' | 'amount' | 'createdAt'): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.loadTransactions();
  }

  public getSortIcon(field: 'date' | 'amount' | 'createdAt'): string {
    if (this.sortBy !== field) return '↕️';
    return this.sortOrder === 'asc' ? '↑' : '↓';
  }

  public clearFilters(): void {
    this.selectedType = 'all';
    this.selectedCategoryId = 'all';
    this.startDateStr = '';
    this.endDateStr = '';
    this.searchQuery = '';
    this.minAmount = null;
    this.maxAmount = null;
    this.quickFilter = 'all';
    this.sortBy = 'date';
    this.sortOrder = 'desc';
    this.loadTransactions();
  }

  public hasActiveFilters(): boolean {
    return this.selectedType !== 'all' ||
      this.selectedCategoryId !== 'all' ||
      this.startDateStr !== '' ||
      this.endDateStr !== '' ||
      this.searchQuery.trim() !== '' ||
      this.minAmount !== null ||
      this.maxAmount !== null;
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

  public getCategoryName(categoryId: string): string {
    const cat = this.categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Sin categoría';
  }

  public getCategoryIcon(categoryId: string): string {
    const cat = this.categories.find(c => c.id === categoryId);
    return cat ? cat.icon : '📁';
  }
}