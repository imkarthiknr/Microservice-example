import { Router } from 'express';
import { toPublicCustomer } from '../customer-repository.js';
import { parseId, validateCustomer } from '../validation.js';

/** `/api/customers` resource (the "business tier"). */
export function customersRouter(repo) {
  const router = Router();

  /** Resolve `:id` once for every route that uses it. */
  router.param('id', (req, res, next, raw) => {
    const id = parseId(raw);
    if (id === null) {
      return res.status(400).json({ error: 'Customer ID must be a positive whole number.' });
    }
    req.customerId = id;
    next();
  });

  router.get('/', async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const customers = await repo.list(search);
    res.json(customers.map(toPublicCustomer));
  });

  router.get('/:id', async (req, res) => {
    const customer = await repo.findById(req.customerId);
    if (!customer) return notFound(res, req.customerId);
    res.json(toPublicCustomer(customer));
  });

  router.post('/', async (req, res) => {
    const { value, errors } = validateCustomer(req.body, { passwordRequired: true });
    if (hasErrors(errors)) return validationFailed(res, errors);
    if (await repo.findByEmail(value.email)) return emailTaken(res);

    const customer = await repo.create(value);
    res.status(201).location(`/api/customers/${customer.id}`).json(toPublicCustomer(customer));
  });

  router.put('/:id', async (req, res) => {
    const { value, errors } = validateCustomer(req.body, { passwordRequired: false });
    if (hasErrors(errors)) return validationFailed(res, errors);

    const owner = await repo.findByEmail(value.email);
    if (owner && owner.id !== req.customerId) return emailTaken(res);

    const customer = await repo.update(req.customerId, value);
    if (!customer) return notFound(res, req.customerId);
    res.json(toPublicCustomer(customer));
  });

  router.delete('/:id', async (req, res) => {
    if (!(await repo.delete(req.customerId))) return notFound(res, req.customerId);
    res.status(204).end();
  });

  return router;
}

const hasErrors = (errors) => Object.keys(errors).length > 0;

const notFound = (res, id) => res.status(404).json({ error: `No customer found with ID ${id}.` });

const validationFailed = (res, fields) =>
  res.status(400).json({ error: 'Validation failed.', fields });

const emailTaken = (res) =>
  res.status(409).json({
    error: 'A customer with this email already exists.',
    fields: { email: 'This email is already in use.' },
  });
