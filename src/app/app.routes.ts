import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { CategoriesList } from './features/categories/categories-list/categories-list';
import { CategoryForm } from './features/categories/category-form/category-form';
import { TransactionsList } from './features/transactions/transactions-list/transactions-list';
import { TransactionForm } from './features/transactions/transaction-form/transaction-form';
import { BudgetList } from './features/budgets/budget-list/budget-list';
import { BudgetForm } from './features/budgets/budget-form/budget-form';

export const routes: Routes = [
    // Default route
    {
        path: '',
        redirectTo: '/dashboard',
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
    }
];
