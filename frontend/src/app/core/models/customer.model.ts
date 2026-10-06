/** A customer as returned by customer-service. The password hash never leaves the service. */
export interface Customer {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/** Body for create (password required) and update (password optional). */
export interface CustomerInput {
  name: string;
  email: string;
  password?: string;
}

/** Error body returned by the API for 4xx responses. */
export interface ApiError {
  error: string;
  fields?: Partial<Record<keyof CustomerInput, string>>;
}
