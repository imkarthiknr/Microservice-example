import { hashPassword } from './password.js';

/**
 * Data-access layer for customers (the "data tier").
 * Routes depend only on these async methods, so the storage engine can be
 * swapped (e.g. for PostgreSQL) without touching HTTP code.
 */
export class CustomerRepository {
  #db;
  #stmts;

  constructor(db) {
    this.#db = db;
    this.#stmts = {
      list: db.prepare('SELECT * FROM customers ORDER BY id'),
      search: db.prepare(
        `SELECT * FROM customers
          WHERE name LIKE :q ESCAPE '\\' OR email LIKE :q ESCAPE '\\'
          ORDER BY id`,
      ),
      byId: db.prepare('SELECT * FROM customers WHERE id = ?'),
      byEmail: db.prepare('SELECT * FROM customers WHERE email = ? COLLATE NOCASE'),
      insert: db.prepare(
        `INSERT INTO customers (name, email, password_hash, created_at, updated_at)
         VALUES (:name, :email, :hash, :now, :now)`,
      ),
      update: db.prepare(
        `UPDATE customers
            SET name = :name, email = :email,
                password_hash = COALESCE(:hash, password_hash), updated_at = :now
          WHERE id = :id`,
      ),
      remove: db.prepare('DELETE FROM customers WHERE id = ?'),
      ping: db.prepare('SELECT 1 AS ok'),
    };
  }

  async list(search) {
    if (!search) return this.#stmts.list.all().map(fromRow);
    const q = `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    return this.#stmts.search.all({ q }).map(fromRow);
  }

  async findById(id) {
    return fromRow(this.#stmts.byId.get(id));
  }

  async findByEmail(email) {
    return fromRow(this.#stmts.byEmail.get(email));
  }

  async create({ name, email, password }) {
    const { lastInsertRowid } = this.#stmts.insert.run({
      name,
      email,
      hash: await hashPassword(password),
      now: new Date().toISOString(),
    });
    return this.findById(Number(lastInsertRowid));
  }

  /** Update a customer. `password` is optional; omit it to keep the current one. */
  async update(id, { name, email, password }) {
    const { changes } = this.#stmts.update.run({
      id,
      name,
      email,
      hash: password ? await hashPassword(password) : null,
      now: new Date().toISOString(),
    });
    return changes ? this.findById(id) : null;
  }

  async delete(id) {
    return this.#stmts.remove.run(id).changes > 0;
  }

  async ping() {
    return this.#stmts.ping.get()?.ok === 1;
  }
}

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The only shape that leaves the service: never includes the password hash. */
export function toPublicCustomer({ id, name, email, createdAt, updatedAt }) {
  return { id, name, email, createdAt, updatedAt };
}
