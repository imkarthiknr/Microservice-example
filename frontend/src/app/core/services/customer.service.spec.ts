import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CustomerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists customers, passing ?search only when given', () => {
    service.list().subscribe();
    expect(http.expectOne('/api/customers').request.params.has('search')).toBe(false);
    service.list('ada').subscribe();
    http.expectOne('/api/customers?search=ada').flush([]);
  });

  it('maps CRUD calls to the right verbs and URLs', () => {
    const input = { name: 'Ada', email: 'ada@example.com', password: 'analytical1' };
    service.get(1).subscribe();
    expect(http.expectOne('/api/customers/1').request.method).toBe('GET');
    service.create(input).subscribe();
    const post = http.expectOne('/api/customers');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(input);
    service.update(2, input).subscribe();
    expect(http.expectOne('/api/customers/2').request.method).toBe('PUT');
    service.delete(3).subscribe();
    expect(http.expectOne('/api/customers/3').request.method).toBe('DELETE');
  });
});
