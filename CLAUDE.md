# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- luôn tuân thủ clean code

## Project Overview

**LoLamBenhAn v2.0** - Ứng dụng bệnh án điện tử (Electronic Medical Records Application) built with a **Turborepo monorepo** architecture. The system provides dynamic medical form management with real-time collaboration capabilities.

## Common Commands

```bash
# Development (all apps)
bun run dev

# Development (specific app)
bun run dev --filter=web    # Frontend only (port 3001)
bun run dev --filter=api    # API only (port 3002)
cd apps/api && bun run dev:ws  # WebSocket server (port 3003)

# Database
bun run db:generate   # Generate Drizzle client
bun run db:push       # Push schema changes to DB
bun run db:studio     # Open Drizzle Studio

# Build & Lint
bun run build
bun run lint

# Testing (API)
cd apps/api && bun run test        # Run tests once
cd apps/api && bun run test:watch  # Watch mode
cd apps/api && bun run test:ui     # Vitest UI
```

## Architecture

### Monorepo Structure
```
apps/
├── api/          # Elysia + Bun Backend (port 3002)
│   ├── src/
│   │   ├── domain/           # Domain entities & repository interfaces
│   │   ├── adapters/         # Repository implementations
│   │   ├── infrastructure/   # Database, WebSocket, Cache
│   │   ├── modules/          # Feature modules (auth, medical-forms, users, upload)
│   │   ├── shared/           # Shared utilities (ResponseDto, errors)
│   │   ├── index.ts          # Main API server
│   │   └── ws-server.ts      # WebSocket server
│   └── drizzle.config.ts
├── web/          # Next.js 15 Frontend (port 3001)
│   └── src/app/  # App Router pages
packages/
├── shared/       # Shared types, API client
├── ui/           # Shared UI components
└── config/       # ESLint, TypeScript, Tailwind configs
```

### Tech Stack

**Backend (apps/api)**
- Runtime: Bun
- Framework: Elysia with Swagger at `/docs`
- Database: PostgreSQL + Drizzle ORM
- Auth: Google OAuth + JWT with RBAC (admin/doctor/student/guest)
- AI: Google Gemini API for chat
- Realtime: WebSocket server for collaborative editing
- File Storage: Cloudinary

**Frontend (apps/web)**
- Framework: Next.js 15 (App Router)
- UI: shadcn/ui + Tailwind CSS v4
- State: Zustand
- Forms: React Hook Form + Zod
- Data Fetching: TanStack Query

### API Routing Pattern

All routes prefixed with `/apis/v1`:
- `/comments` - User comments with rate limiting
- `/hoichan/messages` - Chat messages with file attachments
- `/chat` - AI chat endpoint (Gemini)
- `/auth/*` - Authentication (Google OAuth, JWT)
- `/forms/*` - Form templates and submissions
- `/admin/login` - Admin authentication

### Response Format

Use `ResponseDto` for consistent responses:
```typescript
// Success
ResponseDto.success(data)

// Error - throw custom errors
throw new BadRequestError("message", details)
throw new UnauthorizedError("message")
throw new NotFoundError("message")
throw new RateLimitError(retryAfterSeconds)
```

All responses follow:
```typescript
{
  success: boolean,
  data?: T,
  error?: { code: string, message: string, details?: unknown },
  timestamp: string
}
```

### Database Schema

Key tables (see `apps/api/src/infrastructure/database/schema.ts`):
- `comments` - User feedback
- `hoichan_messages` - Chat messages
- `form_templates` - Dynamic form definitions with JSON schema
- `form_submissions` - Submitted form data
- `users` - User accounts with roles
- `refresh_tokens` - JWT refresh tokens
- `form_permissions` - Role-based access control

### WebSocket Protocol

WebSocket server (port 3003) handles real-time collaboration:
- Message types: `join`, `lock`, `unlock`, `state`, `clear`, `ping`
- Field locking prevents concurrent edit conflicts
- State synchronization across clients

## Environment Variables

Required (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection
- `PORT` - API server port (default: 3002)
- `ADMIN_PASSWORD` / `ADMIN_TOKEN_SECRET` - Admin auth
- `GEMINI_API_KEY` - AI chat
- `GOOGLE_CLIENT_ID` - OAuth
- `CLOUDINARY_*` - File upload

## Development Workflow

1. Start infrastructure: `docker-compose up -d`
2. Install dependencies: `bun install`
3. Setup database: `bun run db:push`
4. Start development: `bun run dev`

API documentation available at `http://localhost:3002/docs`
