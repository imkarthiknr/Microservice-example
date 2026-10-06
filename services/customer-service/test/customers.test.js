import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { ada, alan, makeTestApp } from './helpers.js';

describe('customer-service', () => {
  let app;
  let repo;

  beforeEach(() => {
    ({ app, repo } = makeTestApp());
  });

  const create = (body) => request(app).post('/api/customers').send(body);

  it('GET /health reports the database as up', async () => {
    const res = await request(app).get('/health').expect(200);
    assert.deepEqual(res.body, { status: 'ok', database: true });
  });

  describe('POST /api/customers', () => {
    it('creates a customer, normalises email and hides the password', async () => {
      const res = await create(ada).expect(201);
      assert.equal(res.body.id, 1);
      assert.equal(res.body.email, 'ada@example.com');
      assert.equal(res.headers.location, '/api/customers/1');
      assert.deepEqual(Object.keys(res.body).sort(), [
        'createdAt',
        'email',
        'id',
        'name',
        'updatedAt',
      ]);
    });

    it('stores a salted scrypt hash, never the plain password', async () => {
      await create(ada).expect(201);
      const stored = await repo.findById(1);
      assert.match(stored.passwordHash, /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
      assert.ok(!stored.passwordHash.includes(ada.password));
    });

    it('returns per-field errors for invalid input', async () => {
      const res = await create({ name: '', email: 'nope', password: 'short' }).expect(400);
      assert.deepEqual(Object.keys(res.body.fields).sort(), ['email', 'name', 'password']);
    });

    it('rejects a duplicate email regardless of case', async () => {
      await create(ada).expect(201);
      const res = await create({ ...alan, email: 'ADA@example.com' }).expect(409);
      assert.ok(res.body.fields.email);
    });

    it('returns 400 for malformed JSON', async () => {
      await request(app)
        .post('/api/customers')
        .set('Content-Type', 'application/json')
        .send('{"name":')
        .expect(400);
    });
  });

  describe('GET /api/customers', () => {
    beforeEach(async () => {
      await create(ada).expect(201);
      await create(alan).expect(201);
    });

    it('lists customers in ID order', async () => {
      const res = await request(app).get('/api/customers').expect(200);
      assert.deepEqual(
        res.body.map((c) => c.name),
        ['Ada Lovelace', 'Alan Turing'],
      );
      assert.ok(res.body.every((c) => !('passwordHash' in c)));
    });

    it('filters by name or email with ?search=', async () => {
      const byName = await request(app).get('/api/customers?search=turing').expect(200);
      assert.deepEqual(
        byName.body.map((c) => c.id),
        [2],
      );
      const byEmail = await request(app).get('/api/customers?search=ada@').expect(200);
      assert.deepEqual(
        byEmail.body.map((c) => c.id),
        [1],
      );
    });

    it('treats LIKE wildcards in the search term literally', async () => {
      const res = await request(app).get('/api/customers?search=%25').expect(200);
      assert.equal(res.body.length, 0);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('returns an existing customer', async () => {
      await create(ada).expect(201);
      const res = await request(app).get('/api/customers/1').expect(200);
      assert.equal(res.body.name, 'Ada Lovelace');
    });

    it('returns 404 for an unknown ID', async () => {
      await request(app).get('/api/customers/99').expect(404);
    });

    for (const bad of ['0', '-3', 'abc', '2.5']) {
      it(`returns 400 for invalid ID "${bad}"`, async () => {
        await request(app).get(`/api/customers/${bad}`).expect(400);
      });
    }
  });

  describe('PUT /api/customers/:id', () => {
    beforeEach(async () => {
      await create(ada).expect(201);
      await create(alan).expect(201);
    });

    it('updates name and email and keeps the password when omitted', async () => {
      const before = await repo.findById(1);
      const res = await request(app)
        .put('/api/customers/1')
        .send({ name: 'Augusta Ada King', email: 'ada.king@example.com' })
        .expect(200);
      assert.equal(res.body.name, 'Augusta Ada King');
      assert.equal(res.body.email, 'ada.king@example.com');
      const after = await repo.findById(1);
      assert.equal(after.passwordHash, before.passwordHash);
    });

    it('re-hashes the password when one is provided', async () => {
      const before = await repo.findById(1);
      await request(app)
        .put('/api/customers/1')
        .send({ name: 'Ada', email: 'ada@example.com', password: 'newpass123' })
        .expect(200);
      const after = await repo.findById(1);
      assert.notEqual(after.passwordHash, before.passwordHash);
    });

    it("allows keeping the customer's own email", async () => {
      await request(app)
        .put('/api/customers/1')
        .send({ name: 'Ada', email: 'ADA@example.com' })
        .expect(200);
    });

    it("rejects taking another customer's email", async () => {
      await request(app)
        .put('/api/customers/1')
        .send({ name: 'Ada', email: 'alan@example.com' })
        .expect(409);
    });

    it('validates the payload', async () => {
      await request(app)
        .put('/api/customers/1')
        .send({ name: 'Ada', email: 'ada@example.com', password: 'short' })
        .expect(400);
    });

    it('returns 404 for an unknown customer', async () => {
      await request(app)
        .put('/api/customers/99')
        .send({ name: 'X', email: 'x@example.com' })
        .expect(404);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('deletes a customer and returns 204', async () => {
      await create(ada).expect(201);
      await request(app).delete('/api/customers/1').expect(204);
      await request(app).get('/api/customers/1').expect(404);
    });

    it('returns 404 when the customer does not exist', async () => {
      await request(app).delete('/api/customers/1').expect(404);
    });
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    assert.equal(res.body.error, 'Not found.');
  });
});
