# PB138 - Car-Y-list (Tier List App)

Webová aplikace pro vytváření a sdílení tier listů — hodnocení obrázků (např. aut) do kategorií S/A/B/C/D/E/F ve skupinách.

## 🛠️ Tech Stack

### Client
- **React** 18 + **TypeScript** 5
- **Vite** 5 (dev server + build)
- **TanStack Router** (file-based routing)
- **Clerk** (authentication)
- **shadcn/ui & Tailwind CSS** (component library & styling)

### Server
- **Express.js** 4 + **TypeScript** 5
- **Drizzle ORM** (PostgreSQL)
- **Zod** (validation)
- **Clerk** (authentication middleware)
- **AWS S3 / Supabase Storage** (image storage)
- **Resend** (email notifications)

### Infrastructure
- **Bun** (package manager & runtime)
- **Monorepo** with workspaces (`client/` + `server/`)

## ✨ Požadavky projektu

Aplikace plně implementuje a splňuje veškeré požadavky kladené na projekt v IS MUNI:

1. **Autorizace řízená oprávněními:** Správa rolí (`ADMIN`, `REGISTERED`, `PUBLIC`).

2. **Více než 10 entit v databázi:** Uživatelé, Skupiny, Členové skupin, Obrázky, Tier hodnocení, Soubory, Uživatelské profily a další.

3. **Back-office:** Samostatná sekce dostupná na cestě `/admin` pouze pro roli `ADMIN`. Umožňuje plnou správu uživatelů.

4. **Emailová komunikace:** Integrace služby Resend k automatickému rozesílání HTML notifikačních e-mailů (pozvánky do skupin, notifikace o nových obrázcích).

5. **Komponentová knihovna:** Shadcn/ui

6. **Řádné testování (E2E a Unit):**
   - Unit testy pokrývající schémata a utility funkce.
   - API (E2E) testy pokrývající veškerou backendovou logiku, spouštěné pomocí `bun run test`.

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
| `S3_ENDPOINT` | Custom S3 endpoint (optional, e.g. Supabase Storage) |
| `S3_ACCESS_KEY` | AWS / S3-compatible access key |
| `S3_SECRET_KEY` | AWS / S3-compatible secret key |
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
│   │   ├── app/              # Core logic (api, queries, state, types)
│   │   ├── components/       # Reusable components
│   │   │   ├── shared/       # Shared components (Sidebar, Topbar, etc.)
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   └── authentication/
│   │   ├── screen/           # Page-level screens
│   │   ├── routes/           # TanStack Router file-based routes
│   │   └── App.tsx
│   └── package.json
├── server/                    # Express backend
│   ├── src/
│   │   ├── db/               # Drizzle schema + database client
│   │   ├── middleware/       # Error handling & validation middlewares
│   │   ├── modules/          # App modules (users, groups, images, files)
│   │   ├── schemas.ts        # Zod validation schemas
│   │   ├── auth.ts           # Clerk auth helpers & middlewares
│   │   └── index.ts          # Server entry point
│   └── package.json
├── tests/                     # Tests workspace
│   ├── unit/                 # Unit tests (schemas, auth, utility functions)
│   └── e2e/
│       ├── client/           # Playwright client tests
│       └── server/           # Bun server API tests (groups, images, users)
├── package.json              # Root package definition (monorepo workspaces)
└── README.md
```

## 📁 API Endpoints

### Groups
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/groups` | List user's groups |
| `POST` | `/api/groups` | Create a group |
| `GET` | `/api/groups/:id` | Group detail |
| `PATCH` | `/api/groups/:id` | Update group |
| `DELETE` | `/api/groups/:id` | Delete group |
| `GET` | `/api/groups/:id/members` | List members |
| `POST` | `/api/groups/:id/invite` | Invite member by email |
| `DELETE` | `/api/groups/:id/members/:userId` | Remove member |

### Images
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/groups/:id/images` | List images (optional `?tier=S`) |
| `GET` | `/api/groups/:id/images/unrated` | List unrated images |
| `GET` | `/api/groups/:id/images/counts` | Tier counts |
| `POST` | `/api/groups/:id/images/upload-url` | Get presigned upload URL |
| `POST` | `/api/groups/:id/images` | Create image record |
| `PATCH` | `/api/groups/:id/images/:imageId/tier` | Assign tier (S/A/B/C/D/E/F) |
| `DELETE` | `/api/groups/:id/images/:imageId` | Delete image |

### Users & Profile
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET/PUT/DELETE` | `/api/profile` | User profile management |
| `GET/PUT/DELETE` | `/api/users/:id` | Admin user management |

## 👤 Authors

PB138 Team

## 📄 License

ISC
