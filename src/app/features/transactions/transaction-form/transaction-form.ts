import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TransactionsService } from '../service/transactions.service';
import { CategoriesService } from '../../categories/services/categories.service';
import { Category } from '../../../core/models/category.model';
import { TransactionDTO } from '../../../core/models/transaction.model';

@Component({
  selector: 'app-transaction-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.css',
  standalone: true
})
export class TransactionForm implements OnInit {
  transactionForm!: FormGroup;
  isEditMode = false;
  transactionId: string | null = null;
  isSubmitting = false;
  error: string | null = null;

  categories: Category[] = [];
  filteredCategories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private transactionsService: TransactionsService,
    private categoriesService: CategoriesService,
    private router: Router,
    private route: ActivatedRoute) { }

  public ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();
  }

  public initializeForm(): void {
    const today = new Date().toISOString().substring(0, 10);

    this.transactionForm = this.fb.group({
      type: ['expense', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      categoryId: ['', Validators.required],
      date: [today, Validators.required],
      note: ['', [Validators.maxLength(100)]]
    });

    // Watch for type changes to filter categories
    this.transactionForm.get('type')?.valueChanges.subscribe(type => {
      this.filterCategories(type);
      // Reset category selection when type changes
      this.transactionForm.patchValue({ categoryId: '' });
    });
  }

  public loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.filterCategories(this.transactionForm.get('type')?.value);
        this.checkEditMode();
      },
      error: (err) => console.error('Error loading categories', err)
    });
  }

  public filterCategories(type: 'expense' | 'income'): void {
    this.filteredCategories = this.categories.filter(c => c.type === type);
  }

  public checkEditMode(): void {
    this.transactionId = this.route.snapshot.paramMap.get('id');

    if (this.transactionId) {
      this.isEditMode = true;
      this.transactionsService.getTransactionById(this.transactionId).subscribe({
        next: (transaction) => {
          if (transaction) {
            const dateStr = new Date(transaction.date).toISOString().substring(0, 10);

            this.transactionForm.patchValue({
              type: transaction.type,
              amount: transaction.amount,
              categoryId: transaction.categoryId,
              date: dateStr,
              note: transaction.note
            });

            this.filterCategories(transaction.type);
          } else {
            this.error = 'Transacción no encontrada';
          }
        },
        error: (err) => {
          this.error = 'Error al cargar la transacción';
          console.error(err);
        }
      });
    }
  }

  public onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formValue = this.transactionForm.value;
    const transactionDTO: TransactionDTO = {
      type: formValue.type,
      amount: Number(formValue.amount),
      categoryId: formValue.categoryId,
      date: new Date(formValue.date),
      note: formValue.note
    };

    const request$ = this.isEditMode && this.transactionId
      ? this.transactionsService.updateTransaction(this.transactionId, transactionDTO)
      : this.transactionsService.createTransaction(transactionDTO);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/transactions']);
      },
      error: (err) => {
        this.error = err.message || 'Error al guardar la transacción';
        this.isSubmitting = false;
      }
    });
  }

  public onCancel(): void {
    this.router.navigate(['/transactions']);
  }

  // Getters
  public get type() {
    return this.transactionForm.get('type');
  }

  public get amount() {
    return this.transactionForm.get('amount');
  }

  public get categoryId() {
    return this.transactionForm.get('categoryId');
  }

  public get date() {
    return this.transactionForm.get('date');
  }

  public get note() {
    return this.transactionForm.get('note');
  }
}