# Development

## Project Structure

```
atrium/
  apps/
    api/              NestJS REST API
    web/              Next.js frontend (dashboard + portal)
  packages/
    database/         Prisma schema, client, migrations, seed
    shared/           Shared types, constants, utilities
    email/            Email templates (React Email)
  e2e/                Playwright end-to-end tests
  docker/             Production Dockerfiles
```

## Scripts Reference

Run from the repository root with `bun run <script>`.

| Script       | Description                                          |
|--------------|------------------------------------------------------|
| `setup`      | One-command bootstrap (env, Docker, deps, DB, seed)  |
| `dev`        | Start all services in development mode               |
| `build`      | Build all packages and apps                          |
| `test`       | Run unit tests across all packages                   |
| `test:e2e`   | Run Playwright end-to-end tests                      |
| `test:all`   | Run unit tests + e2e tests                           |
| `lint`       | Lint all packages                                    |
| `db:generate`| Regenerate the Prisma client                         |
| `db:push`    | Push schema changes to the database                  |
| `db:migrate` | Run Prisma migrations (development)                  |
| `db:migrate:deploy` | Apply pending migrations (production)          |
| `db:seed`    | Seed the database with demo data                     |
| `clean`      | Remove build artifacts                               |

## Testing

```bash
bun run test          # Unit tests (Bun test runner)
bun run test:e2e      # E2E tests (Playwright, requires servers running)
bun run test:all      # Both
```

E2E tests auto-start the API and web servers when not already running. They create a unique test account per run and authenticate via the API before executing browser tests.
