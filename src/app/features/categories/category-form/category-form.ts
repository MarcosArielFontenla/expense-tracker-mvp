import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoriesService } from '../services/categories.service';
import { CategoryDTO } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
  standalone: true
})
export class CategoryForm implements OnInit {
  categoryForm!: FormGroup;
  isEditMode = false;
  categoryId: string | null = null;
  isSubmitting = false;
  error: string | null = null;

  // Available icons for selection
  availableIcons = [
    '🍔', '🚗', '🏠', '🎮', '💊', '💡', '📚', '👕',
    '💰', '📈', '💵', '🛒', '✈️', '🎬', '🏋️', '🐶',
    '☕', '🍕', '🎨', '💼', '📱', '🎵', '🏥', '⚽'
  ];

  // Available colors for selection
  availableColors = [
    '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b'
  ];

  constructor(
    private fb: FormBuilder,
    private categoriesService: CategoriesService,
    private router: Router,
    private route: ActivatedRoute) { }

  public ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
  }

  public initializeForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      icon: ['🍔', Validators.required],
      color: ['#ef4444', Validators.required],
      type: ['expense', Validators.required]
    });
  }

  public checkEditMode(): void {
    this.categoryId = this.route.snapshot.paramMap.get('id');

    if (this.categoryId) {
      this.isEditMode = true;
      this.loadCategory(this.categoryId);
    }
  }

  public loadCategory(id: string): void {
    this.categoriesService.getCategoryById(id).subscribe({
      next: (category) => {
        if (category) {
          this.categoryForm.patchValue({
            name: category.name,
            icon: category.icon,
            color: category.color,
            type: category.type
          });
        } else {
          this.error = 'Categoría no encontrada';
        }
      },
      error: (err) => {
        this.error = 'Error al cargar la categoría';
        console.error(err);
      }
    });
  }

  public selectIcon(icon: string): void {
    this.categoryForm.patchValue({ icon });
  }

  public selectColor(color: string): void {
    this.categoryForm.patchValue({ color });
  }

  public onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const categoryDTO: CategoryDTO = this.categoryForm.value;

    const request$ = this.isEditMode && this.categoryId
      ? this.categoriesService.updateCategory(this.categoryId, categoryDTO)
      : this.categoriesService.createCategory(categoryDTO);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/categories']);
      },
      error: (err) => {
        this.error = err.message || 'Error al guardar la categoría';
        this.isSubmitting = false;
      }
    });
  }

  public onCancel(): void {
    this.router.navigate(['/categories']);
  }

  // Getters for form controls
  public get name() {
    return this.categoryForm.get('name');
  }

  public get icon() {
    return this.categoryForm.get('icon');
  }

  public get color() {
    return this.categoryForm.get('color');
  }

  public get type() {
    return this.categoryForm.get('type');
  }
}