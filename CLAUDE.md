# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack TypeScript application for carbon footprint tracking and environmental education through gamified learning paths. Users complete quizzes scored against the ADEME Base Carbone API, earn "feuilles" (leaf points), and progress through learning paths (parcours).

## Commands

### Backend (`/backend`)

```bash
npm run start:dev        # Dev server with hot reload
npm run build            # Production build
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting
npm run test             # Jest unit tests
npm run test:watch       # Jest watch mode
npm run test:cov         # Jest with coverage
npm run test:e2e         # E2E tests
npm run swagger:generate # Generate OpenAPI schema → used by frontend
npx prisma migrate dev   # Run DB migrations (dev)
npx prisma migrate deploy # Run DB migrations (prod)
npx prisma studio        # Open Prisma Studio GUI
```

### Frontend (`/frontend`)

```bash
npm run dev              # Vite dev server
npm run build            # Production build
npm run test             # Vitest tests
npm run generate:api     # Regenerate OpenAPI TypeScript client from backend Swagger
```

> **Important:** After modifying backend endpoints, run `npm run swagger:generate` in `/backend` then `npm run generate:api` in `/frontend` to keep the API client in sync.

### Docker

```bash
docker compose up --build   # Build and start all services
docker compose down          # Stop and remove containers
```

## Architecture

### Frontend (`/frontend/src`)

- **Router**: TanStack Router (file-based). Routes live in `src/routes/`. The `routeTree.gen.ts` is auto-generated — never edit it manually.
- **API Client**: Auto-generated OpenAPI client in `src/api/client/`. Custom hooks in `src/api/hooks/` wrap these with TanStack Query.
- **Auth**: `src/auth/` contains `AuthContext` which stores the JWT in localStorage and exposes it to the OpenAPI client. The root route (`__root.tsx`) acts as an auth guard.
- **UI Components**: `src/components/ui/` are shadcn/ui components (do not modify these directly; regenerate via CLI). Feature components live under `src/components/{feature}/`.

### Backend (`/backend/src`)

- **NestJS module structure**: each domain has its own module folder (`auth/`, `quiz/`, `user/`, `parcours/`, `health/`, `supabase/`).
- **Authentication**: Supabase JWT validation via `SupabaseGuard`. Use `@CurrentUser()` decorator to access the authenticated user in controllers.
- **Quiz scoring**: `quiz-scoring.service.ts` calls the ADEME Base Carbone API and computes carbon footprints. Results are saved to `score_history`.
- **Database**: Prisma ORM with PostgreSQL. Schema at `prisma/schema.prisma`. Key tables: `users`, `quizzes`, `score_history`, `parcours`, `levels`.
- **Swagger**: `src/swagger.ts` generates the OpenAPI spec used by the frontend client generator.

### Data Flow

1. User authenticates → Supabase JWT → stored in localStorage
2. Frontend sends requests via generated OpenAPI client with Bearer token
3. `SupabaseGuard` validates JWT on protected routes
4. Quiz answers submitted → backend calls ADEME API → score persisted → user feuilles updated
5. User assigned to a parcours during onboarding → unlocks home dashboard

## Environment Configuration

Copy `/backend/.env.template` to `/backend/.env`:

```
SUPABASE_URL=
SUPABASE_KEY=
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...  # For Prisma migrations
API_PORT=8000
FRONT_ORIGIN=http://localhost:3000
```

## Key Conventions

- Backend DTOs use `class-validator` decorators for validation.
- All API responses from backend should align with the generated Swagger schema.
- Frontend state is managed via TanStack Query — avoid local state for server data.
- Tailwind CSS v4 is used (no `tailwind.config.js` — config is in CSS via `@theme`).
