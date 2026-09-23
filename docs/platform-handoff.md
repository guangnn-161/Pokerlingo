# Platform handoff — owner A

## What is ready

- pnpm monorepo: `apps/web`, `packages/contracts`, `packages/db`
- Auth.js database session with GitHub, Google, and optional Resend magic links
- Initial platform migration: users, Auth.js tables, profiles, audit logs
- `GET /api/health` and `GET /api/me`
- `PATCH /api/profile`: authenticated, same-origin, Zod validated, rate limited, audited
- Request IDs through API middleware; all API error payloads use `code/message/requestId/details?`

## Contracts v0.1

Import only from declared subpaths, for example:

```ts
import { profileUpdateSchema } from "@pokerlingo/contracts/api";
import type { CurrentUser } from "@pokerlingo/contracts/auth";
```

B/C/D should submit a schema proposal before a new database table/migration. A owns migration files and provider configuration.

## Local environment

Copy `.env.example` to `.env`. Minimum required: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`. Set at least one provider pair to enable sign-in.

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

## Environment and deployment rules

| Environment | Database | Required behavior |
|---|---|---|
| Development | local/dev DB | safe seed allowed |
| Preview | separate preview DB | never run destructive or production migration |
| Production | pooled production DB | migration run once from protected job/operator |

Do not expose server secrets in `NEXT_PUBLIC_*`. The in-memory rate limiter is only a local fallback; production needs the Redis/Upstash adapter before public traffic.

## Next integrations

- B calls no auth internals; protect math routes through `getCurrentUser()` only where user identity is required.
- C proposes tables for scenarios/attempts/XP/daily puzzle; A will create an additive migration.
- D uses `GET /api/me` for the signed-in state and treats profile visibility as private by default.

## Known limits

- OAuth provider credentials, Resend, database, Vercel and error tracking require project-level configuration.
- The initial UI is deliberately minimal. Product UI is owned by D.
- Add a committed `pnpm-lock.yaml` after the first verified local install, then switch CI/Vercel back to `--frozen-lockfile`.