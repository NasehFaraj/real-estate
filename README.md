# Real Estate API

REST API for managing real-estate offers, client requests, internal matching, authentication, and role-based access for `admin`, `manager`, and `broker` users.

## Stack

- Node.js 20
- TypeScript
- Express 5
- MongoDB with Mongoose
- Vitest + Supertest
- Swagger UI
- Docker Compose

## Features

- Cookie-based authentication with access and refresh tokens
- Role-based access control for `admin`, `manager`, and `broker`
- CRUD flows for users, offers, and requests
- Automatic offer/request matching
- Statistics endpoints for operational reporting
- Filter and pagination support
- Swagger docs for API exploration
- Dockerized local development and test setup

## Project structure

```text
src/
  Models/         Mongoose models
  config/         env, database, swagger
  controllers/    route handlers
  middlewares/    auth, access, error, request id
  routes/         API route definitions
  test/           integration tests
  utils/          helpers, validators, matching, filters
```

## Roles

- `admin`: manages users and can access all protected resources
- `manager`: manages offers, requests, matches, and stats
- `broker`: creates and views only their own offers and requests

## Local development

### Requirements

- Node.js 20+
- MongoDB running locally, or Docker Desktop / Docker Engine

### Run locally

```bash
npm install
cp .env.example .env
```

Fill the required secrets in `.env`, then run:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

## Docker

```bash
cp .env.example .env
docker compose up -d --build
```

Useful commands:

```bash
docker compose logs -f api
curl http://localhost:3000/api/health
docker compose down
```

## API documentation

- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/docs.json`

Swagger is enabled by default in non-production environments. In production, set `ENABLE_SWAGGER=true` only if you want it exposed.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run check
```

## Tests

Integration tests require Docker because the test setup starts MongoDB through `docker compose`.

```bash
npm test
```

Current suite covers:

- authentication
- role-based access control
- offers and requests workflows
- filtering and pagination
- statistics endpoints

## Environment variables

### Required

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

### Common

- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `CORS_ORIGINS`
- `TRUST_PROXY`
- `ENABLE_SWAGGER`
- `AUTH_DEBUG`

### Auth and cookies

- `ACCESS_EXPIRESIN`
- `REFRESH_EXPIRESIN`
- `ALGORITHM`
- `ACCESS_COOKIE_NAME`
- `REFRESH_COOKIE_NAME`
- `ACCESS_COOKIE_MAX_AGE_MS`
- `REFRESH_COOKIE_MAX_AGE_MS`
- `COOKIE_SAMESITE`

### Docker-specific

- `MONGO_ROOT_USERNAME`
- `MONGO_ROOT_PASSWORD`
- `MONGO_DB_NAME`

## Example endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/users`
- `POST /api/offers`
- `GET /api/offers/me`
- `POST /api/requests`
- `GET /api/stats`

## Publishing notes

- Do not commit `.env`
- Keep `ENABLE_SWAGGER=false` in production unless docs must be public
- Set strong JWT secrets before deployment
- Restrict `CORS_ORIGINS` to your frontend domains in production
