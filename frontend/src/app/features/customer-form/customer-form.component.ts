import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { describeHttpError, fieldErrors } from '../../core/http-error';
import { Customer, CustomerInput } from '../../core/models/customer.model';
import { CustomerService } from '../../core/services/customer.service';
import { NotificationService } from '../../core/services/notification.service';
import { lettersAndNumbers } from '../../shared/validators/password.validators';

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Create and edit form. Routed at `/customers/new` and `/customers/:id/edit`;
 * the `id` route param is bound to the `id` input (withComponentInputBinding).
 */
@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css',
})
export class CustomerFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly customers = inject(CustomerService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  /** Route param; undefined when creating. */
  readonly id = input<string>();

  protected readonly customerId = computed(() => {
    const raw = this.id();
    return raw === undefined ? null : Number(raw);
  });
  protected readonly isEdit = computed(() => this.customerId() !== null);
  protected readonly minLength = PASSWORD_MIN_LENGTH;
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(PASSWORD_MIN_LENGTH), lettersAndNumbers]],
  });

  ngOnInit(): void {
    const id = this.customerId();
    if (id === null) {
      this.form.controls.password.addValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity();
      return;
    }
    if (!Number.isInteger(id) || id < 1) {
      this.error.set('Customer ID must be a positive whole number.');
      this.form.disable();
      return;
    }
    this.loading.set(true);
    this.customers.get(id).subscribe({
      next: (c) => {
        this.loading.set(false);
        this.form.patchValue({ name: c.name, email: c.email });
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(describeHttpError(err));
        this.form.disable();
      },
    });
  }

  protected showError(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.getRawValue();
    const body: CustomerInput = { name: name.trim(), email: email.trim() };
    if (password) body.password = password;

    const id = this.customerId();
    const request$: Observable<Customer> =
      id === null ? this.customers.create(body) : this.customers.update(id, body);

    this.saving.set(true);
    this.error.set(null);
    request$.subscribe({
      next: (c) => {
        this.saving.set(false);
        this.notify.show(id === null ? `Created ${c.name} (ID ${c.id}).` : `Saved ${c.name}.`);
        this.router.navigate(['/customers']);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        for (const [field, message] of Object.entries(fieldErrors(err))) {
          const control = this.form.get(field);
          control?.setErrors({ ...control.errors, server: message });
          control?.markAsTouched();
        }
        this.error.set(describeHttpError(err));
      },
    });
  }
}
