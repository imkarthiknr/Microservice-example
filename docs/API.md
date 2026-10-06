# customer-service API

Base URL: `http://localhost:6102` (direct). In Docker the service is only reachable through nginx at `http://localhost:8080`.

Requests and responses are JSON. Errors always look like this:

```json
{ "error": "Human-readable message.", "fields": { "email": "Optional per-field message." } }
```

## Customer object

```json
{
  "id": 1,
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "createdAt": "2026-10-06T07:00:00.000Z",
  "updatedAt": "2026-10-06T07:00:00.000Z"
}
```

The password hash is stored but **never** returned.

## Validation rules

| Field      | Rules                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| `name`     | Required, trimmed, at most 80 characters                                  |
| `email`    | Required, valid format, trimmed and lower-cased, unique (case-insensitive) |
| `password` | Required on create, optional on update; at least 8 characters with a letter and a digit |

## `GET /health`

| Status | Body                                        |
| ------ | ------------------------------------------- |
| `200`  | `{ "status": "ok", "database": true }`      |
| `503`  | `{ "status": "degraded", "database": false }` |

## `GET /api/customers`

Lists customers ordered by ID.

| Query    | Description                                                     |
| -------- | --------------------------------------------------------------- |
| `search` | Optional. Case-insensitive substring match on name or email. Wildcards are matched literally. |

```bash
curl "http://localhost:6102/api/customers?search=ada"
```

**200**: an array of customer objects.

## `GET /api/customers/:id`

| Status | When                               |
| ------ | ---------------------------------- |
| `200`  | Customer object                    |
| `400`  | `id` is not a positive integer     |
| `404`  | No such customer                   |

## `POST /api/customers`

```bash
curl -X POST http://localhost:6102/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Linus Torvalds","email":"linus@example.com","password":"kernel1991"}'
```

| Status | When                                                         |
| ------ | ------------------------------------------------------------ |
| `201`  | Created. The body is the customer, and `Location: /api/customers/{id}` is set |
| `400`  | Validation failed (`fields`) or malformed JSON               |
| `409`  | Email already in use (`fields.email`)                        |
| `413`  | Body larger than 10 kB                                       |

## `PUT /api/customers/:id`

Replaces `name` and `email`. Include `password` only to change it.

```bash
curl -X PUT http://localhost:6102/api/customers/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Augusta Ada King","email":"ada@example.com"}'
```

| Status | When                                                  |
| ------ | ----------------------------------------------------- |
| `200`  | Updated customer                                      |
| `400`  | Invalid `id`, validation failed or malformed JSON     |
| `404`  | No such customer                                      |
| `409`  | Email belongs to a different customer                 |

## `DELETE /api/customers/:id`

| Status | When                           |
| ------ | ------------------------------ |
| `204`  | Deleted (no body)              |
| `400`  | `id` is not a positive integer |
| `404`  | No such customer               |
