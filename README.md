# PB138 - Lonely Student (Study Planner)

Webová aplikace pro organizaci studia — správa předmětů, úkolů, kalendáře, souborů a studijních plánů.

## 🛠️ Tech Stack

### Frontend
- **React** 18 + **TypeScript** 5
- **Vite** 5 (dev server + build)
- **TanStack Router** (file-based routing)
- **TanStack Query** (server-state management)
- **Clerk** (authentication)
- **shadcn/ui** (component library)

### Backend
- **Express.js** 4 + **TypeScript** 5
- **Drizzle ORM** (PostgreSQL)
- **Zod** (validation)
- **Clerk** (authentication middleware)
- **AWS S3** (file storage)

### Infrastructure
- **Bun** (package manager & runtime)
- **Monorepo** with workspaces (`client/` + `server/`)

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

### 3. Run development servers
```bash
bun run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### 4. Type checking
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
│   │   ├── screen/           # Screen components (responsive, unified)
│   │   │   ├── CalendarScreen.tsx
│   │   │   ├── FilesScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── StudyPlanScreen.tsx
│   │   │   └── TasksScreen.tsx
│   │   ├── routes/           # TanStack Router file-based routes
│   │   └── App.tsx
│   └── package.json
├── server/                    # Express backend
│   ├── src/
│   │   ├── db/               # Drizzle schema + client
│   │   ├── middleware/       # Error handler, validation
│   │   ├── repositories/    # Data access layer (repository pattern)
│   │   ├── schemas.ts        # Zod validation schemas
│   │   ├── auth.ts           # Clerk auth helpers
│   │   └── index.ts          # Server entry point
│   └── package.json
├── package.json              # Root (monorepo workspaces)
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

## 👤 Authors

PB138 Team

## 📄 License

ISC
