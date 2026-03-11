# AGENTS.md

Guide for AI agents working in the LoLamBenhAn v2.0 codebase - an Electronic Medical Records application built with a Turborepo monorepo architecture.

## Project Overview

**LoLamBenhAn v2.0** is a Vietnamese medical records application supporting multiple specialties (internal medicine, surgery, obstetrics, pediatrics, etc.) with dynamic form management, real-time collaboration, and AI-powered assistance.

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun (v1.2.5+) |
| **Monorepo** | Turborepo |
| **Backend** | Elysia (Bun framework) with Swagger |
| **Frontend** | Next.js 15 (App Router) |
| **Database** | PostgreSQL + Drizzle ORM |
| **Auth** | Google OAuth + JWT with RBAC |
| **AI** | Google Gemini API |
| **Realtime** | WebSocket server (ws) |
| **Storage** | Cloudinary |
| **UI** | shadcn/ui + Tailwind CSS v4 |
| **State** | Zustand |
| **Forms** | React Hook Form + Zod |
| **Testing** | Vitest |

## Essential Commands

### Development

```bash
# Start all apps (API on :3002, Web on :3001)
bun run dev

# Start specific app
bun run dev --filter=web    # Frontend only
bun run dev --filter=api    # API only

# WebSocket server (separate process, :3003)
cd apps/api && bun run dev:ws
```

### Database

```bash
bun run db:generate   # Generate Drizzle client from schema
bun run db:push       # Push schema changes to DB (no migrations)
bun run db:migrate    # Run migrations
bun run db:studio     # Open Drizzle Studio GUI
```

### Build & Quality

```bash
bun run build         # Build all apps and packages
bun run lint          # ESLint across monorepo
bun run clean         # Clean all dist/.next folders
```

### Testing (API only)

```bash
cd apps/api
bun run test          # Run tests once
bun run test:watch    # Watch mode
bun run test:ui       # Vitest UI
bun run test:coverage # Coverage report
```

### Infrastructure

```bash
docker-compose up -d  # Start PostgreSQL + Redis
```

## Architecture

### Monorepo Structure

```
apps/
├── api/                    # Elysia backend (port 3002)
│   ├── src/
│   │   ├── index.ts            # Main API entry, routes registration
│   │   ├── ws-server.ts        # WebSocket server (port 3003)
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/           # Authentication (Google OAuth, JWT)
│   │   │   ├── users/          # User management
│   │   │   ├── upload/         # File upload (Cloudinary)
│   │   │   └── medical-forms/  # Dynamic forms system
│   │   ├── domain/             # Domain entities & repository interfaces
│   │   ├── adapters/           # Repository implementations
│   │   ├── infrastructure/     # DB, WebSocket, Cache
│   │   └── shared/             # ResponseDto, error classes
│   ├── tests/                  # Unit and integration tests
│   ├── drizzle.config.ts
│   └── vitest.config.ts
│
├── web/                    # Next.js frontend (port 3001)
│   └── src/
│       ├── app/                # App Router pages
│       │   ├── benhan/         # Medical form pages by specialty
│       │   ├── benhan-dynamic/ # Dynamic form rendering
│       │   ├── admin/          # Admin dashboard
│       │   ├── hoichan/        # Discussion/chat
│       │   └── login/          # Authentication
│       ├── components/
│       │   ├── ui/             # shadcn/ui components
│       │   ├── form/           # Dynamic form components
│       │   ├── auth/           # Auth-related components
│       │   └── benhan/         # Medical form components
│       ├── lib/
│       │   ├── api/            # API client functions
│       │   ├── hooks/          # Custom hooks
│       │   ├── store/          # Zustand stores
│       │   └── utils/          # Utility functions
│       └── hooks/              # Global hooks (collaboration, auth)
│
packages/
├── shared/                 # Shared types, API client
├── ui/                     # Shared UI components
└── config/                 # ESLint, TypeScript, Tailwind configs
```

### Port Assignments

| Service | Port |
|---------|------|
| Web (Next.js) | 3001 |
| API (Elysia) | 3002 |
| WebSocket | 3003 |
| PostgreSQL | 5432 |
| Redis | 6379 |

## API Patterns

### Route Prefix

All API routes are prefixed with `/apis/v1`:

```
/apis/v1/              # Health check
/apis/v1/docs          # Swagger documentation
/apis/v1/forms/*       # Form templates & submissions
/apis/v1/auth/*        # Authentication endpoints
/apis/v1/comments      # User feedback
/apis/v1/hoichan/*     # Discussion messages
/apis/v1/chat          # AI chat (Gemini)
/apis/v1/admin/login   # Admin authentication
```

### Response Format

All responses use `ResponseDto` for consistency:

```typescript
// Success
ResponseDto.success(data)

// Error - throw custom errors
throw new BadRequestError("message", details)
throw new UnauthorizedError("message")
throw new NotFoundError("message")
throw new RateLimitError(retryAfterSeconds)
```

Response structure:
```typescript
{
  success: boolean,
  data?: T,
  error?: { code: string, message: string, details?: unknown },
  timestamp: string
}
```

### Authentication

Two auth systems exist:

1. **Admin Auth**: Simple token-based with `verifyToken()` for admin routes
2. **User Auth**: Google OAuth + JWT with RBAC roles: `admin`, `doctor`, `student`, `guest`

Use `bearer` from `@elysiajs/bearer` to extract tokens, then verify with appropriate method.

### Route Definition Pattern

```typescript
import { Elysia, t } from "elysia"
import { ResponseDto, BadRequestError } from "../../shared/response.dto"

export const myRoutes = new Elysia({ prefix: "/my-route" })
  .get("/", async () => {
    return ResponseDto.success({ items: [] })
  })
  .post(
    "/",
    async ({ body, bearer }) => {
      if (!bearer) throw new UnauthorizedError()
      // ...
    },
    {
      body: t.Object({
        name: t.String(),
        value: t.Optional(t.Number()),
      }),
    }
  )
```

## Database Schema

Key tables in `apps/api/src/infrastructure/database/schema.ts`:

| Table | Purpose |
|-------|---------|
| `comments` | User feedback |
| `hoichan_messages` | Chat/discussion messages |
| `form_templates` | Dynamic form definitions (JSON schema) |
| `form_submissions` | Submitted form data |
| `submission_history` | Audit trail for submissions |
| `users` | User accounts with roles |
| `refresh_tokens` | JWT refresh tokens |
| `form_permissions` | Role-based form access control |

### Type Generation

Types are inferred from schema:
```typescript
export type FormTemplate = typeof formTemplates.$inferSelect
export type NewFormTemplate = typeof formTemplates.$inferInsert
```

### Specialty Types

Medical specialties are typed:
```typescript
type Specialty = 'noi-khoa' | 'tien-phau' | 'hau-phau' | 'san-khoa' | 
                 'phu-khoa' | 'nhi-khoa' | 'yhct' | 'dieu-duong' | 
                 'gmhs-sv' | 'gmhs-bs' | 'khac'
```

## WebSocket Protocol

WebSocket server (`ws-server.ts`) runs on port 3003 for real-time collaboration:

### Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `join` | Client → Server | Join a room |
| `lock` | Client → Server | Lock a field for editing |
| `unlock` | Client → Server | Release field lock |
| `state` | Bidirectional | Sync form state |
| `clear` | Client → Server | Clear room state |
| `ping/pong` | Bidirectional | Keepalive |

### Field Locking

Before editing, clients must lock fields to prevent conflicts:
```typescript
// Client requests lock
{ type: "lock", room: "form-123", fieldId: "patientName", by: "user-456" }

// Server confirms or denies
{ type: "lock", fieldId: "patientName", by: "user-456", at: 1234567890 }
{ type: "lock-denied", fieldId: "patientName", by: "other-user" }
```

## Frontend Patterns

### Component Structure

- `'use client'` directive for client components
- shadcn/ui components in `components/ui/`
- Feature-specific components grouped by domain

### State Management

- **Zustand** for global state (auth store, theme)
- **React Hook Form** for form state
- **TanStack Query** for server state

### Custom Hooks

Key hooks in `lib/hooks/`:
- `useMedicalForm` - Form operations
- `useFormPersistence` - LocalStorage auto-save
- `useFormAutoSave` - Auto-save to server
- `useFormExport` - Export functionality

Collaboration hook in `hooks/use-collaboration.ts` for WebSocket integration.

### Dynamic Forms

`DynamicForm` component (`components/form/dynamic-form.tsx`) renders forms from JSON schema:
- Supports field types: text, textarea, number, date, datetime, select, radio, checkbox
- Auto-validation based on field config
- LocalStorage persistence with debounce
- Collapsible sections

## Environment Variables

Required (see `.env.example`):

```bash
# Database
DATABASE_URL=postgresql://...

# API
PORT=3002

# Admin
ADMIN_PASSWORD=...
ADMIN_TOKEN_SECRET=...

# AI
GEMINI_API_KEY=...

# OAuth
GOOGLE_CLIENT_ID=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3002/apis/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3003
```

## Testing

Tests located in `apps/api/tests/`:
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests

Test file naming: `*.test.ts`

Setup file: `tests/setup.ts`

Run with Vitest:
```bash
cd apps/api
bun run test              # All tests
bun run test path/to/test # Specific test
bun run test:watch        # Watch mode
```

## Development Workflow

1. **Start infrastructure**: `docker-compose up -d`
2. **Install dependencies**: `bun install`
3. **Setup database**: `bun run db:push`
4. **Start development**: `bun run dev`
5. **Start WebSocket** (separate terminal): `cd apps/api && bun run dev:ws`

API documentation: `http://localhost:3002/docs`

## Code Conventions

### Language

- Comments and UI text in Vietnamese where user-facing
- Code, variable names, and technical comments in English

### File Naming

- Routes: `*.routes.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- Components: `kebab-case.tsx`
- Hooks: `use-*.ts`

### Import Organization

Group imports logically:
1. External packages
2. Internal modules (use relative paths with `../../`)
3. Types

### Error Handling

Always use custom error classes from `shared/response.dto.ts`:
- Never throw generic `Error`
- Include details for debugging when appropriate
- Let the global error handler format responses

## Gotchas

### Monorepo Dependencies

- Packages in `packages/` are workspace packages
- Use `--filter` flag for targeted commands: `bun run dev --filter=api`
- Shared types from `@lolambenhan/shared`

### Database Migrations

- `db:push` for development (direct schema sync)
- `db:migrate` for production (migration files)
- Schema changes require `db:generate` to update Drizzle client

### WebSocket Independence

- WebSocket server runs separately from HTTP API
- Both must be started for full functionality
- WebSocket does not share the Elysia app instance

### Form Schema Complexity

- Form templates store full JSON schema in `templateSchema` column
- Includes sections, fields, validation rules, conditional logic
- Changes to template schema require migration consideration

### Rate Limiting

- Chat endpoint has built-in rate limiting (`CHAT_MAX_RPM` env var)
- Comments have per-IP limits (5 per 7 days)
- Consider rate limiting for new public endpoints

### Authentication Dual System

- Admin routes use simple token verification (`verifyToken()`)
- User routes use Google OAuth + JWT via `authService`
- Check which system applies before implementing auth checks
