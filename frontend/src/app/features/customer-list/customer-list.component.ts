import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { describeHttpError } from '../../core/http-error';
import { Customer } from '../../core/models/customer.model';
import { CustomerService } from '../../core/services/customer.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-customer-list',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css',
})
export class CustomerListComponent {
  private readonly customers = inject(CustomerService);
  private readonly notify = inject(NotificationService);
  private readonly refresh$ = new Subject<void>();

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly items = signal<Customer[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  /** ID of the row currently asking "Delete? Yes / No". */
  protected readonly confirmingId = signal<number | null>(null);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly searchTerm = signal('');

  constructor() {
    const term$ = this.search.valueChanges.pipe(
      debounceTime(300),
      map((v) => v.trim()),
      startWith(''),
      distinctUntilChanged(),
    );

    combineLatest([term$, this.refresh$.pipe(startWith(undefined))])
      .pipe(
        tap(([term]) => {
          this.searchTerm.set(term);
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([term]) =>
          this.customers.list(term).pipe(
            catchError((err: unknown) => {
              this.loading.set(false);
              this.error.set(describeHttpError(err));
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((list) => {
        this.loading.set(false);
        this.items.set(list);
      });
  }

  protected askDelete(id: number): void {
    this.confirmingId.set(id);
  }

  protected cancelDelete(): void {
    this.confirmingId.set(null);
  }

  protected confirmDelete(customer: Customer): void {
    this.deletingId.set(customer.id);
    this.customers.delete(customer.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.confirmingId.set(null);
        this.notify.show(`Deleted ${customer.name}.`);
        this.refresh$.next();
      },
      error: (err: unknown) => {
        this.deletingId.set(null);
        this.confirmingId.set(null);
        this.error.set(describeHttpError(err));
      },
    });
  }

  protected retry(): void {
    this.refresh$.next();
  }
}
