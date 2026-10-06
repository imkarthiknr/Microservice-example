# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-06

A full rebuild of the original college project into a documented, tested, containerised three-tier app.

### Added

- `services/customer-service`: Express 5 customer API (list/search, get, create, update, delete), `/health` with a DB check, SQLite persistence via `node:sqlite`, salted `scrypt` password hashing, JSON request logs and graceful shutdown.
- Angular console: customer table with debounced search, create/edit form with client and server validation, inline delete confirmation, toast notifications.
- Dockerfiles for both units, an nginx reverse proxy, and `docker-compose.yml` with a persistent volume and health-gated startup.
- Tests: `node:test` + Supertest for the service, Vitest for the console.
- GitHub Actions CI: unit tests, format check, production build, and a Docker Compose end-to-end smoke test.
- README, DEVELOPMENT guide, API reference, CONTRIBUTING, MIT license, screenshots.

### Changed

- Restructured from a single `ThreetierObservable/` Angular app into `frontend/` + `services/customer-service/`.
- Upgraded Angular 10 (NgModules, Zone.js, Karma, Protractor, TSLint) → Angular 21 (standalone, signals, zoneless, Vitest, Prettier).
- API redesigned around a single `/api/customers` resource. The old split `/customer/:id` and `/customers/:id` endpoints with client-chosen IDs are replaced by server-generated IDs.
- `alert()` popups replaced with inline errors and notifications.

### Removed

- Hard-coded `http://127.0.0.1:6102` URLs in the client (now a relative `/api` behind a proxy).
- Angular CLI placeholder specs and the unused `HomeComponent`.

### Fixed

- Navigation to a `/GetDelete` route that did not exist.
- Line-ending churn on Windows checkouts (`.gitattributes`).

## [0.1.0] - 2020-08-10

### Added

- Original Angular 10 "ThreetierObservable" client with add/update and get/delete screens calling a customer service on port 6102.

[1.0.0]: https://github.com/imkarthiknr/Microservice-example/compare/0c03874...master
[0.1.0]: https://github.com/imkarthiknr/Microservice-example/commit/0c03874
