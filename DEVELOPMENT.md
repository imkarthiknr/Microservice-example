# Development Guide

How to set up, run, test and extend the project. For an overview, see the [README](README.md).

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running](#running)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Testing](#testing)
- [Code style](#code-style)
- [Continuous integration](#continuous-integration)
- [Common tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

## Prerequisites

| Tool           | Version                                   | Needed for              |
| -------------- | ----------------------------------------- | ----------------------- |
| Node.js        | `^22.13.0` or `>=24` (`.nvmrc` pins 22)   | Local development       |
| npm            | 10+                                       | Local development       |
| Docker Desktop | Compose v2                                | Containerised run       |

Node 22.13+ is required because the service uses the built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html) module. It needs no native build step and no extra dependency. Node still labels the module experimental, so the npm scripts pass `--disable-warning=ExperimentalWarning` to keep logs clean.

## Setup

```bash
git clone https://github.com/imkarthiknr/Microservice-example.git
cd Microservice-example
nvm use            # optional
npm install        # root tooling (concurrently)
npm run setup      # npm ci in services/customer-service and frontend
```

Each deployable unit (`services/customer-service`, `frontend`) has its own `package.json`, lockfile and Dockerfile, so it can be built and released independently. The root `package.json` only holds convenience scripts.

## Running

### Local, with hot reload

```bash
npm run dev
```

| Process          | URL                    | Notes                                         |
| ---------------- | ---------------------- | --------------------------------------------- |
| Console          | http://localhost:4200  | Angular dev server; proxies `/api` → `:6102`  |
| customer-service | http://localhost:6102  | `node --watch`; SQLite at `services/customer-service/data/customers.db` |

To run them separately:

```bash
npm run dev --prefix services/customer-service
npm start   --prefix frontend
```

### Docker Compose

```bash
docker compose up --build        # foreground
npm run docker:up                # detached
docker compose logs -f customer-service
npm run docker:down              # stop (keeps data)
docker compose down --volumes    # stop and delete the database volume
```

The console is at http://localhost:8080. The service is not published to the host. It is only reachable through nginx on the Compose network, which mirrors how an internal service would be deployed.

## Configuration

`customer-service` reads these environment variables (see `src/config.js`):

| Variable         | Default               | Description                                         |
| ---------------- | --------------------- | --------------------------------------------------- |
| `PORT`           | `6102`                | HTTP port                                           |
| `DATABASE_PATH`  | `data/customers.db`   | SQLite file (`:memory:` for a throwaway DB)         |
| `SEED_DEMO_DATA` | `true`                | Seed 3 demo customers when the table is empty       |
| `LOG_REQUESTS`   | `true`                | One JSON log line per request on stdout             |

Port 6102 is the one the original 2020 frontend called, kept for continuity.

The console has no runtime configuration. It always calls the relative path `/api`, which is proxied by `proxy.conf.json` in development and `nginx.conf` in Docker.

## Architecture

### Request flow

```
CustomerListComponent ─┐
CustomerFormComponent ─┴─▶ CustomerService (HttpClient) ─▶ /api/customers
                                                             │  dev: Angular proxy   docker: nginx
                                                             ▼
                              routes/customers.js ─▶ CustomerRepository ─▶ node:sqlite ─▶ customers.db
                              (validation, status codes)  (SQL, row mapping)
```

### customer-service

| Layer        | File                         | Responsibility                                                         |
| ------------ | ---------------------------- | ---------------------------------------------------------------------- |
| Bootstrap    | `server.js`                  | Load config, open DB, seed, listen, graceful shutdown on SIGINT/SIGTERM |
| HTTP         | `app.js`                     | JSON body limit (10 kB), request logging, `/health`, 404 and error handlers |
| Resource     | `routes/customers.js`        | Validation, status codes, email-uniqueness rules                       |
| Data access  | `customer-repository.js`     | Prepared SQL statements; maps rows to domain objects                   |
| Schema       | `db.js`                      | Opens the DB (WAL mode) and applies `CREATE TABLE IF NOT EXISTS`       |
| Rules        | `validation.js`, `password.js` | Pure functions, unit-testable in isolation                           |

Design notes:

- **Dependency injection.** `createApp({ repo })` receives the repository, so tests run against an in-memory SQLite database with no ports, files or mocks.
- **One exit point for data.** `toPublicCustomer()` decides which fields leave the service. The password hash never does.
- **Email uniqueness** is enforced twice. The route returns a friendly `409`, and the DB has a `UNIQUE COLLATE NOCASE` constraint as a backstop. Emails are also lower-cased before storage.
- **Search** uses `LIKE` with `%`, `_` and `\` escaped, so user input is always matched literally. All SQL uses bound parameters.
- **PUT semantics.** `name` and `email` are required, and `password` is optional (omit it to keep the current one). This matches what the edit form sends.

### Console (frontend)

```
src/app/
├── core/
│   ├── models/customer.model.ts     Customer, CustomerInput, ApiError
│   ├── services/customer.service.ts HTTP client for the API
│   ├── services/notification.service.ts  Signal-based toast
│   └── http-error.ts                Error → message / field errors
├── features/
│   ├── customer-list/               /customers
│   └── customer-form/               /customers/new, /customers/:id/edit
├── shared/validators/
├── app.routes.ts                    Lazy routes
└── app.config.ts                    Router (component input binding), HttpClient (fetch)
```

- **Standalone, zoneless, signals.** View state lives in signals, and RxJS is used where streams fit: debounced search with `switchMap` cancelling stale requests.
- **One form for create and edit.** The `:id` route param binds straight to an `id` input through `withComponentInputBinding()`. The password is required only when creating.
- **Inline delete confirmation** instead of `window.confirm`, which keeps it accessible and testable.
- **Server errors map to fields.** The `fields` object from a `400` or `409` response is applied to the matching form controls.

## Testing

```bash
npm test                                          # everything
npm test --prefix services/customer-service       # API (node:test + Supertest)
npm test --prefix frontend                        # Vitest, single run
npm run test:watch --prefix frontend              # Vitest watch mode
```

| Suite            | Tests | Covers                                                                                  |
| ---------------- | ----- | --------------------------------------------------------------------------------------- |
| customer-service | 27    | Every endpoint and status code, email uniqueness on create and update, password re-hash vs keep, search and wildcard escaping, ID parsing, malformed JSON, health |
| frontend         | 17    | `CustomerService` verbs and URLs, list (load, empty, error and retry, delete confirm and cancel, debounced search), form (create, edit prefill, PUT without password, 404, 409 field errors), toast |

Conventions:

- Each service test gets a fresh in-memory database (`test/helpers.js`).
- Frontend HTTP tests use `HttpTestingController` and call `verify()` in `afterEach`, which fails a test on any unexpected request.
- Prefer driving tests through the DOM (inputs, buttons) over calling component methods.

## Code style

- **Prettier** for the frontend (`frontend/.prettierrc`). Run `npm run format --prefix frontend`. CI runs `format:check`.
- **`.editorconfig`**: 2-space indentation, UTF-8, final newline.
- **`.gitattributes`**: LF in the repository, so Windows checkouts don't show whole-file diffs.
- **TypeScript**: `strict` with `strictTemplates`. Avoid `any`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `ci:`, `chore:`).

## Continuous integration

`.github/workflows/ci.yml` runs on pushes to `master` and on pull requests:

| Job              | What it does                                                                     |
| ---------------- | -------------------------------------------------------------------------------- |
| customer-service | `npm ci` → `npm test` on Node 22 and 24                                          |
| frontend         | `npm ci` → `format:check` → `npm test` → `npm run build`                         |
| docker           | `docker compose up --build --wait`, then smoke tests through nginx: SPA served, list, create → update → delete, data persists across a service restart |

## Common tasks

**Add a field (e.g. `phone`)**

1. `db.js`: add the column. For an existing database, append an `ALTER TABLE` migration.
2. `customer-repository.js`: include it in the INSERT/UPDATE statements and in `fromRow`. Add it to `toPublicCustomer` if it's public.
3. `validation.js` and tests.
4. Frontend: update `customer.model.ts`, add the form control and template block, and the list column if wanted.
5. Update [docs/API.md](docs/API.md).

**Add another microservice**

Create `services/<name>/` with its own `package.json`, `Dockerfile` and `/health` endpoint. Add it to `docker-compose.yml` (with its own volume if it owns data) and add a `location /api/<resource>/` block in `frontend/nginx.conf`. Add a CI job mirroring `customer-service`.

**Reset local data**

Delete `services/customer-service/data/`, or run `docker compose down --volumes`.

## Troubleshooting

| Symptom                                                         | Fix                                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `No such built-in module: node:sqlite`                          | Node is older than 22.13. Upgrade, or run `nvm use`.                                    |
| Console shows *"Cannot reach customer-service. Is it running?"* | Start the service (`npm run dev --prefix services/customer-service`) and check the port matches `frontend/proxy.conf.json`. |
| `EADDRINUSE :::6102`                                            | Something else holds the port. Stop it or set `PORT` and update the proxy target.       |
| `web` container never starts                                    | It waits for `customer-service` to be healthy. Check `docker compose logs customer-service`. |
| `npm install` fails with `reading 'edgesOut'`                   | A known npm 10 bug. Use `npm ci` (lockfiles are committed) or `npx npm@11 install`.     |

## Roadmap

- [ ] Authentication (JWT or OIDC) on the API and a login screen
- [ ] PostgreSQL behind the same repository interface, plus versioned migrations
- [ ] OpenAPI spec served at `/api/docs`
- [ ] A second service (e.g. `order-service`) that references customers, plus an API gateway
- [ ] Pagination on `GET /api/customers`
- [ ] Playwright end-to-end tests in CI
- [ ] Metrics endpoint (Prometheus) and request IDs for tracing
