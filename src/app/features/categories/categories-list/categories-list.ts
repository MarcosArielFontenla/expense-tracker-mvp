import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-categories-list',
  imports: [CommonModule],
  templateUrl: './categories-list.html',
  styleUrl: './categories-list.css',
  standalone: true
})
export class CategoriesList implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  filterType: 'all' | 'expense' | 'income' = 'all';
  isLoading = false;
  error: string | null = null;

  constructor(
    private categoriesService: CategoriesService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCategories();

      // Subscribe to category changes
      this.categoriesService.categories$.subscribe(categories => {
        this.categories = categories;
        this.applyFilter();
      });
    }
  }

  loadCategories(): void {
    this.isLoading = true;
    this.error = null;

    this.categoriesService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las categorías';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  applyFilter(): void {
    if (this.filterType === 'all') {
      this.filteredCategories = this.categories;
    } else {
      this.filteredCategories = this.categories.filter(c => c.type === this.filterType);
    }
  }

  setFilter(type: 'all' | 'expense' | 'income'): void {
    this.filterType = type;
    this.applyFilter();
  }

  onCreateCategory(): void {
    this.router.navigate(['/categories/new']);
  }

  onEditCategory(category: Category): void {
    this.router.navigate(['/categories/edit', category.id]);
  }

  onDeleteCategory(category: Category): void {
    if (confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      this.categoriesService.deleteCategory(category.id).subscribe({
        next: () => {
          // Category list will update automatically via subscription
        },
        error: (err) => {
          this.error = 'Error al eliminar la categoría';
          console.error(err);
        }
      });
    }
  }

  getCategoryCount(type: 'expense' | 'income'): number {
    return this.categories.filter(c => c.type === type).length;
  }
}
