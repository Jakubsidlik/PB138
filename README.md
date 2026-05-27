# PB138 - Lonely Student (Study Planner)

Webová aplikace pro organizaci studia — správa předmětů, úkolů, kalendáře, souborů a studijních plánů.

## 🛠️ Tech Stack

### Client
- **React** 18 + **TypeScript** 5
- **Vite** 5 (dev server + build)
- **TanStack Router** (file-based routing)
- **TanStack Query** (server-state management)
- **Clerk** (authentication)
- **shadcn/ui & Tailwind CSS** (component library & styling)

### Server
- **Express.js** 4 + **TypeScript** 5
- **Drizzle ORM** (PostgreSQL)
- **Zod** (validation)
- **Clerk** (authentication middleware)
- **AWS S3** (file storage)
- **Resend** (email notifications)

### Infrastructure
- **Bun** (package manager & runtime)
- **Monorepo** with workspaces (`client/` + `server/`)

## ✨ Požadavky projektu

Aplikace plně implementuje a splňuje veškeré požadavky kladené na projekt, které jsou v IS MUNI:

1. **Autorizace řízená oprávněními:** Správa rolí (`ADMIN`, `REGISTERED`, `PUBLIC`).

2. **Více než 10 entit v databázi:** Uživatelé, Studijní plány, Spolupracovníci, Předměty, Sdílení předmětů, Úkoly, Soubory, Sdílení souborů, Hodnocení souborů, Lekce/Poznámky, Hodnocení lekcí, Kalendářní události, Štítky a vazby

3. **Back-office:** Samostatná sekce dostupná na cestě `/admin` pouze pro roli `ADMIN`. Umožňuje plnou správu uživatelů.

4. **Emailová komunikace:** Integrace služby Resend k automatickému rozesílání HTML notifikačních e-mailů s odkazy do aplikace.

5. **Komponentová knihovna:** Shadcn

6. **Řádné testování (E2E a Unit):** 
   - Unit a API testy pokrývající veškerou backendovou logiku, spouštěné pomocí `bun run test`.

7. **Světlý a tmavý motiv:** Podpora přepínání světlého a tmavého režimu.

## 🚀 Getting Started

### 1. Install dependencies
```bash
bun install
```

### 2. Configure environment variables

Copy the example files and fill in your values:

```bash
# Client
cp client/.env.example client/.env

# Server
cp server/.env.example server/.env
```

#### Client (`client/.env`)
| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key from [dashboard.clerk.com](https://dashboard.clerk.com) |
| `VITE_API_URL` | Backend API URL (default: `http://localhost:5000`) |

#### Server (`server/.env`)
| Variable | Description |
|---|---|
| `PORT` | Server port (default: `5000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `S3_REGION` | AWS S3 region (default: `eu-west-1`) |
| `S3_ENDPOINT` | Custom S3 endpoint (optional) |
| `S3_ACCESS_KEY` | AWS access key |
| `S3_SECRET_KEY` | AWS secret key |
| `S3_BUCKET_NAME` | S3 bucket name (default: `pb138-bucket`) |
| `RESEND_API_KEY` | Resend API key for email notifications (optional) |

### 3. Run development servers
```bash
bun run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### 4. Running Tests
```bash
# Run unit & server API tests
bun run test

# Run frontend E2E tests (Playwright)
bun playwright test
```

### 5. Type checking
```bash
bun run type-check
```

## 📋 Project Structure

```
pb138/
├── client/                    # React frontend
│   ├── src/
│   │   ├── app/              # Core logic (api, queries, state, types, utils)
│   │   ├── components/       # Reusable components
│   │   │   ├── shared/       # Shared components (Sidebar, Topbar, etc.)
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── layout/       # Layout components (RootLayout)
│   │   │   └── authentication/
│   │   ├── screen/           # Responsive & unified screens
│   │   ├── routes/           # TanStack Router file-based routes
│   │   └── App.tsx
│   └── package.json
├── server/                    # Express backend
│   ├── src/
│   │   ├── db/               # Drizzle schema + database client
│   │   ├── middleware/       # Error handling & validation middlewares
│   │   ├── modules/          # App modules (users, tasks, files, subjects, etc.)
│   │   ├── schemas.ts        # Zod validation schemas
│   │   ├── auth.ts           # Clerk auth helpers & middlewares
│   │   └── index.ts          # Server entry point
│   └── package.json
├── tests/                     # Tests workspace
│   ├── unit/                 # Unit tests (schemas, auth guards, utility functions)
│   └── e2e/                  # End-to-End tests
│       ├── client/           # Playwright client tests
│       └── server/           # Bun server API tests
├── package.json              # Root package definition (monorepo workspaces)
└── README.md
```

## 📁 API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET/POST` | `/api/tasks` | CRUD for tasks |
| `GET/POST` | `/api/events` | CRUD for calendar events |
| `GET/POST` | `/api/subjects` | CRUD for subjects |
| `GET/POST` | `/api/files` | CRUD for files |
| `GET/POST` | `/api/lessons` | CRUD for lessons |
| `GET/POST` | `/api/study-plans` | CRUD for study plans |
| `GET/PUT` | `/api/profile` | User profile management |
| `GET` | `/api/admin/files` | Administration file moderation list |
| `PATCH` | `/api/admin/files/:id/moderation` | Shared file moderation |

## 👤 Authors

PB138 Team

## 📄 License

ISC
