# 🏥 LoLamBenhAn v2.0

Ứng dụng bệnh án điện tử với kiến trúc **Monorepo** - **Frontend** và **Backend** tách biệt, dễ scale và maintain.

## 🏗️ Kiến trúc

```
lolambenhan-v2/
├── apps/
│   ├── web/          # Next.js 15 Frontend (shadcn/ui)
│   └── api/          # Elysia + Bun Backend
├── packages/
│   ├── shared/       # Shared types & utilities
│   ├── ui/           # Shared UI components
│   └── config/       # ESLint, TypeScript, Tailwind configs
└── turbo.json        # Turborepo configuration
```

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development (all apps)
bun run dev

# Start specific app
bun run dev --filter=web
bun run dev --filter=api
```

## 🛠️ Tech Stack

### Frontend (apps/web)
- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query

### Backend (apps/api)
- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Auth**: Google OAuth
- **AI**: Gemini + Groq fallback
- **Realtime**: WebSocket

## 📦 Packages

| Package | Mô tả |
|---------|-------|
| `@lolambenhan/shared` | Shared types, utilities, API client |
| `@lolambenhan/ui` | Shared UI components |
| `@lolambenhan/config` | ESLint, TSConfig, Tailwind |

## 🔧 Development

```bash
# Database
bun run db:generate   # Generate Drizzle client
bun run db:push       # Push schema to DB
bun run db:studio     # Open Drizzle Studio

# Build
bun run build

# Lint
bun run lint
```

## 📝 Environment Variables

Copy `.env.example` to `.env` và điền các giá trị:

```bash
cp .env.example .env
```
