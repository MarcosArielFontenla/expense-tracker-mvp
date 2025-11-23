import { Routes } from '@angular/router';
import { CategoriesList } from './features/categories/categories-list/categories-list';
import { CategoryForm } from './features/categories/category-form/category-form';
import { TransactionsList } from './features/transactions/transactions-list/transactions-list';
import { TransactionForm } from './features/transactions/transaction-form/transaction-form';

export const routes: Routes = [
    // Default route
    {
        path: '',
        redirectTo: '/categories',
        pathMatch: 'full'
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
    }
];
