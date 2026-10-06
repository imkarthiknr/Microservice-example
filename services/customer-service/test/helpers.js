import { createApp } from '../src/app.js';
import { CustomerRepository } from '../src/customer-repository.js';
import { openDatabase } from '../src/db.js';

/** A fresh app backed by its own in-memory SQLite database. */
export function makeTestApp() {
  const db = openDatabase(':memory:');
  const repo = new CustomerRepository(db);
  return { app: createApp({ repo }), repo, db };
}

export const ada = { name: 'Ada Lovelace', email: 'Ada@Example.com ', password: 'analytical1' };
export const alan = { name: 'Alan Turing', email: 'alan@example.com', password: 'enigma1912' };
