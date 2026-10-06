import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { CustomerListComponent } from './customer-list.component';

const ada = { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', createdAt: '', updatedAt: '' };
const alan = {
  id: 2,
  name: 'Alan Turing',
  email: 'alan@example.com',
  createdAt: '',
  updatedAt: '',
};

describe('CustomerListComponent', () => {
  let fixture: ComponentFixture<CustomerListComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const button = (text: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === text,
    )!;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CustomerListComponent);
    el = fixture.nativeElement;
    await render();
  });

  afterEach(() => http.verify());

  it('loads and renders customers', async () => {
    http.expectOne('/api/customers').flush([ada, alan]);
    await render();
    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[1].textContent).toContain('alan@example.com');
  });

  it('shows an empty state', async () => {
    http.expectOne('/api/customers').flush([]);
    await render();
    expect(el.textContent).toContain('No customers yet.');
  });

  it('shows an error with a working retry', async () => {
    http.expectOne('/api/customers').flush(null, { status: 0, statusText: 'Unknown' });
    await render();
    expect(el.querySelector('[role=alert]')?.textContent).toContain('Cannot reach');
    button('Retry').click();
    http.expectOne('/api/customers').flush([ada]);
    await render();
    expect(el.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('asks for confirmation, deletes, notifies and reloads', async () => {
    http.expectOne('/api/customers').flush([ada, alan]);
    await render();

    el.querySelector<HTMLButtonElement>('[aria-label="Delete Ada Lovelace"]')!.click();
    await render();
    expect(el.textContent).toContain('Delete?');
    http.expectNone({ method: 'DELETE' });

    button('Yes').click();
    http.expectOne({ method: 'DELETE', url: '/api/customers/1' }).flush(null);
    http.expectOne('/api/customers').flush([alan]);
    await render();

    expect(TestBed.inject(NotificationService).message()).toBe('Deleted Ada Lovelace.');
    expect(el.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('cancelling the confirmation does not delete', async () => {
    http.expectOne('/api/customers').flush([ada]);
    await render();
    el.querySelector<HTMLButtonElement>('[aria-label="Delete Ada Lovelace"]')!.click();
    await render();
    button('No').click();
    await render();
    expect(el.textContent).not.toContain('Delete?');
  });

  it('searches after the user stops typing', async () => {
    http.expectOne('/api/customers').flush([ada, alan]);
    await render();
    vi.useFakeTimers();
    try {
      const input = el.querySelector<HTMLInputElement>('#search')!;
      input.value = 'turing';
      input.dispatchEvent(new Event('input'));
      http.expectNone('/api/customers?search=turing');
      vi.advanceTimersByTime(300);
      http.expectOne('/api/customers?search=turing').flush([alan]);
    } finally {
      vi.useRealTimers();
    }
    await render();
    expect(el.querySelectorAll('tbody tr').length).toBe(1);
  });
});
