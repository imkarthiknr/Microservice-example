import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'customers' },
  {
    path: 'customers',
    title: 'Customers',
    loadComponent: () =>
      import('./features/customer-list/customer-list.component').then(
        (m) => m.CustomerListComponent,
      ),
  },
  {
    path: 'customers/new',
    title: 'New customer',
    loadComponent: () =>
      import('./features/customer-form/customer-form.component').then(
        (m) => m.CustomerFormComponent,
      ),
  },
  {
    path: 'customers/:id/edit',
    title: 'Edit customer',
    loadComponent: () =>
      import('./features/customer-form/customer-form.component').then(
        (m) => m.CustomerFormComponent,
      ),
  },
  { path: '**', redirectTo: 'customers' },
];
