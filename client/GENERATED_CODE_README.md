# Generated Code struktura

## ✅ Co bylo vytvořeno

Vytvořil jsem kompletní strukturu generovaného kódu z OpenAPI specifikace:

```
client/src/gen/
├── models/                 # TypeScript definitions
│   ├── task.ts            # Task, CreateTaskRequest, UpdateTaskRequest, etc.
│   ├── subject.ts         # Subject, CreateSubjectRequest, UpdateSubjectRequest
│   └── index.ts           # Re-exports
├── zod/                    # Validation schemas
│   ├── task.ts            # taskSchema, createTaskRequestSchema, etc.
│   ├── subject.ts         # subjectSchema, createSubjectRequestSchema, etc.
│   └── index.ts           # Re-exports
├── client/                 # Axios HTTP clients
│   ├── index.ts           # createApiClients() factory
│   ├── tasks-client.ts    # TasksClient (list, create, update, delete, bulkUpdate)
│   └── subjects-client.ts # SubjectsClient (list, create, update, delete)
├── hooks/                  # TanStack Query hooks
│   ├── use-tasks.ts       # useTasks, useTasksInfinite, useCreateTask, etc.
│   ├── use-subjects.ts    # useSubjects, useSubjectsInfinite, useCreateSubject, etc.
│   └── index.ts           # Re-exports
└── index.ts               # Main entry point
```

## 📦 Wrapper files (aktualizovány)

- **`client/src/app/api.ts`** - Singleton instance & re-exports
- **`client/src/app/hooks.ts`** - Convenience hooks s prefilem apiClients

## 🎯 Použití

### Import modů

```typescript
// Modely (typy)
import type { Task, Subject, CreateTaskRequest } from './gen/models'

// Zod schémata (validace)
import { taskSchema, createTaskRequestSchema } from './gen/zod'

// API klient
import { apiClients, createApiClients } from './gen/client'

// React Query hooky
import { useTasks, useCreateTask, useDeleteTask } from './gen/hooks'
```

### Convenience imports (doporučeno)

```typescript
// Ze wrapper souboru
import { useTasks, useCreateTask } from './hooks'
import { apiClient, apiClients } from './api'
import type { Task, CreateTaskRequest } from './api'
```

## 🔄 Regenerace

Pokud se změní OpenAPI specifikace (`../openapi.yaml`):

```bash
cd client
npx kubb generate
```

Všechny soubory v `src/gen/` se automaticky regenerují.

## 💡 Klíčové vlastnosti

✅ **Type-safe** - Plná TypeScript podpora  
✅ **Runtime validation** - Zod schémata pro runtime checks  
✅ **React Query integrated** - useQuery, useMutation, useInfiniteQuery  
✅ **Infinite scroll support** - Automatická infinite query paginace  
✅ **Cursor pagination** - Podpora cursor-based paginace  
✅ **Full OpenAPI support** - Všechny filtry, parametry, response kódy  

## 📖 Další informace

Detailní dokumentace: Podívejte se na [KUBB_SETUP.md](./KUBB_SETUP.md)
