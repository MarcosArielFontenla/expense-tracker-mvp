import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { CategoriesList } from './features/categories/categories-list/categories-list';
import { CategoryForm } from './features/categories/category-form/category-form';
import { TransactionsList } from './features/transactions/transactions-list/transactions-list';
import { TransactionForm } from './features/transactions/transaction-form/transaction-form';
import { BudgetList } from './features/budgets/budget-list/budget-list';
import { BudgetForm } from './features/budgets/budget-form/budget-form';
import { Layout } from './core/layout/layout';
import { NotFound } from './core/pages/not-found/not-found';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    // Public routes
    {
        path: 'login',
        component: Login
    },
    {
        path: 'register',
        component: Register
    },

    // Protected routes
    {
        path: '',
        component: Layout,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            // Dashboard
            {
                path: 'dashboard',
                component: Dashboard
            },

            // Categories routes
            {
                path: 'categories',
                component: CategoriesList
            },
            {
                path: 'categories/new',
                component: CategoryForm
            },
            {
                path: 'categories/edit/:id',
                component: CategoryForm
            },

            // Transactions routes
            {
                path: 'transactions',
                component: TransactionsList
            },
            {
                path: 'transactions/new',
                component: TransactionForm
            },
            {
                path: 'transactions/edit/:id',
                component: TransactionForm
            },

            // Budgets routes
            {
                path: 'budgets',
                component: BudgetList
            },
            {
                path: 'budgets/new',
                component: BudgetForm
            },
            {
                path: 'budgets/edit/:id',
                component: BudgetForm
            },

            // 404 Wildcard
            {
                path: '**',
                component: NotFound
            }
        ]
    }
];