import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NotificationService } from '../../core/services/notification.service';
import { CustomerFormComponent } from './customer-form.component';

const ada = { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', createdAt: '', updatedAt: '' };

describe('CustomerFormComponent', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  const el = () => harness.routeNativeElement!;
  const fill = (values: Record<string, string>) => {
    for (const [id, value] of Object.entries(values)) {
      const input = el().querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
    }
  };
  const submit = async () => {
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    await harness.fixture.whenStable();
  };
  const settle = async () => {
    harness.detectChanges();
    await harness.fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(
          [
            { path: 'customers', children: [] },
            { path: 'customers/new', component: CustomerFormComponent },
            { path: 'customers/:id/edit', component: CustomerFormComponent },
          ],
          withComponentInputBinding(),
        ),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  describe('create', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/customers/new', CustomerFormComponent);
    });

    it('requires a password and does not submit an empty form', async () => {
      await submit();
      http.expectNone('/api/customers');
      expect(el().textContent).toContain('Password is required.');
    });

    it('POSTs the trimmed customer, notifies and returns to the list', async () => {
      fill({ name: '  Ada Lovelace ', email: 'ada@example.com', password: 'analytical1' });
      await submit();
      const req = http.expectOne({ method: 'POST', url: '/api/customers' });
      expect(req.request.body).toEqual({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'analytical1',
      });
      req.flush(ada);
      await settle();
      expect(TestBed.inject(Router).url).toBe('/customers');
      expect(TestBed.inject(NotificationService).message()).toContain('Created Ada Lovelace');
    });

    it('shows a 409 email conflict on the email field', async () => {
      fill({ name: 'Ada', email: 'ada@example.com', password: 'analytical1' });
      await submit();
      http.expectOne('/api/customers').flush(
        {
          error: 'A customer with this email already exists.',
          fields: { email: 'This email is already in use.' },
        },
        { status: 409, statusText: 'Conflict' },
      );
      await settle();
      expect(el().textContent).toContain('This email is already in use.');
    });
  });

  describe('edit', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/customers/1/edit', CustomerFormComponent);
      http.expectOne('/api/customers/1').flush(ada);
      await settle();
    });

    it('prefills the form from the API', () => {
      expect(el().querySelector('h2')?.textContent).toContain('Edit customer #1');
      expect(el().querySelector<HTMLInputElement>('#name')!.value).toBe('Ada Lovelace');
      expect(el().querySelector<HTMLInputElement>('#password')!.value).toBe('');
    });

    it('PUTs without a password when it is left blank', async () => {
      fill({ name: 'Augusta Ada King' });
      await submit();
      const req = http.expectOne({ method: 'PUT', url: '/api/customers/1' });
      expect(req.request.body).toEqual({ name: 'Augusta Ada King', email: 'ada@example.com' });
      req.flush({ ...ada, name: 'Augusta Ada King' });
      await settle();
      expect(TestBed.inject(Router).url).toBe('/customers');
    });
  });

  it('shows an error and disables the form for an unknown customer', async () => {
    await harness.navigateByUrl('/customers/99/edit', CustomerFormComponent);
    http
      .expectOne('/api/customers/99')
      .flush({ error: 'No customer found with ID 99.' }, { status: 404, statusText: 'Not Found' });
    await settle();
    expect(el().textContent).toContain('No customer found with ID 99.');
    expect(el().querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(true);
  });
});
