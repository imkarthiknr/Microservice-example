import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Customer, CustomerInput } from '../models/customer.model';

/**
 * Client for customer-service. Calls the relative `/api` path, which is
 * proxied to the service by the Angular dev server or by nginx in Docker.
 */
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/customers';

  list(search = ''): Observable<Customer[]> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<Customer[]>(this.baseUrl, { params });
  }

  get(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${id}`);
  }

  create(input: CustomerInput): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, input);
  }

  update(id: number, input: CustomerInput): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}/${id}`, input);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
