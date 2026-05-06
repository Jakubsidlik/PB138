# Code Generation Migration Guide

## 🎉 Co bylo hotovo

Úspěšně jsem nakonfiguroval Kubb pro automatické generování kódu z OpenAPI specifikace.

## 📂 Nová struktura

```
client/
├── kubb.config.ts              ✨ Aktualizovaná konfigurace
├── KUBB_SETUP.md              📖 Detailní dokumentace
├── GENERATED_CODE_README.md    📖 Quick reference
├── src/
│   ├── app/
│   │   ├── api.ts             🔄 Aktualizovaný wrapper
│   │   ├── hooks.ts           🔄 Aktualizovaný wrapper
│   │   └── ... (ostatní soubory bez změn)
│   ├── gen/                    ✨ NOVĚ GENEROVANĚ
│   │   ├── models/
│   │   │   ├── task.ts
│   │   │   ├── subject.ts
│   │   │   └── index.ts
│   │   ├── zod/
│   │   │   ├── task.ts
│   │   │   ├── subject.ts
│   │   │   └── index.ts
│   │   ├── client/
│   │   │   ├── tasks-client.ts
│   │   │   ├── subjects-client.ts
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── use-tasks.ts
│   │   │   ├── use-subjects.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── ... (ostatní soubory bez změn)
└── ... (ostatní soubory)
```

## ✨ Co se změnilo

### 1. Kubb konfigurace
- ✅ `pluginTs()` - Generuje TypeScript modely
- ✅ `pluginZod()` - Generuje Zod validační schémata
- ✅ `pluginClient()` - Generuje Axios klienty
- ✅ `pluginReactQuery()` - Generuje TanStack Query hooky
- ✅ `barrelFiles: true` - Generuje index.ts pro jednoduší importy

### 2. Wrapper soubory (aktualizovány)
- **api.ts** - Teď exportuje generovaný kód a vytváří singleton instance
- **hooks.ts** - Teď exportuje React Query hooky a convenience wrappery

### 3. Generovaný kód
Všechny nové soubory v `src/gen/`:
- 🔴 **NEMĚNIT RUČNĚ** - Automaticky generují se z openapi.yaml
- 🟢 **Regenerovat** - Spusťte `npx kubb generate`

## 🚀 Jak na to

### Jedenkrát (počáteční setup)

```bash
cd client

# Instalace Kubb (pokud již není nainstalován)
npm install -D @kubb/cli @kubb/core @kubb/plugin-ts @kubb/plugin-zod @kubb/plugin-react-query @kubb/plugin-client

# Generování kódu
npx kubb generate
```

### Při změně API

1. Aktualizujte `../openapi.yaml`
2. Spusťte:
   ```bash
   cd client
   npx kubb generate
   ```
3. Git commit změn v `src/gen/`

## 📦 Import cheat sheet

```typescript
// Models (typy)
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  Subject,
  CreateSubjectRequest,
} from './gen/models'

// Zod schemas (validace)
import {
  taskSchema,
  createTaskRequestSchema,
  subjectSchema,
} from './gen/zod'

// API clients (přímý přístup)
import { createApiClients, TasksClient, SubjectsClient } from './gen/client'

// React Query hooks (doporučeno)
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useBulkUpdateTasks,
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from './gen/hooks'

// Convenience wrapper (s prefilled apiClients)
import {
  useTasks,
  useCreateTask,
  useDeleteTask,
  useSubjects,
  useCreateSubject,
} from './hooks'

import { apiClients, apiClient } from './api'
```

## 💡 Příklady

### Fetching data

```typescript
import { useTasks } from './hooks'

function TaskList() {
  const { data, isLoading } = useTasks({
    subjectId: 42,
    done: false,
    paginated: true,
    limit: 20,
  })

  return (
    <div>
      {isLoading ? 'Načítám...' : (
        data?.data?.map(task => <div key={task.id}>{task.title}</div>)
      )}
    </div>
  )
}
```

### Vytvoření s mutací

```typescript
import { useCreateTask } from './hooks'

function CreateTaskForm() {
  const { mutate, isPending, error } = useCreateTask()

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      mutate({
        title: 'Nový úkol',
        subjectId: 42,
      })
    }}>
      <input placeholder="Název úkolu" />
      <button disabled={isPending}>Vytvořit</button>
      {error && <div>Chyba: {error.message}</div>}
    </form>
  )
}
```

### Validace pomocí Zod

```typescript
import { createTaskRequestSchema } from './gen/zod'

const userInput = { title: '', subjectId: 42 }
const result = createTaskRequestSchema.safeParse(userInput)

if (!result.success) {
  console.error('Chyba:', result.error.flatten())
}
```

### Infinite scroll

```typescript
import { useTasksInfinite } from './hooks'

function InfiniteTaskList() {
  const { data, fetchNextPage, hasNextPage } = useTasksInfinite({
    subjectId: 42,
  })

  const allTasks = data?.pages.flatMap(p => p.data) ?? []

  return (
    <div>
      {allTasks.map(task => <div key={task.id}>{task.title}</div>)}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Načíst více</button>
      )}
    </div>
  )
}
```

## ⚠️ DŮLEŽITÉ

1. **Neměňte ručně soubory v `src/gen/`**
   - Budou přepsány při dalším `npx kubb generate`

2. **Aktualizujte `openapi.yaml` nejdřív**
   - Pak spusťte `npx kubb generate`

3. **Commitujte `src/gen/` do gitu**
   - Je to generovaný kód, ale měl by být v gitu

4. **Updatujte `kubb.config.ts` pokud se změní struktura API**
   - Když přidáte nové tagy, pluginy, atd.

## 📚 Dokumentace

- Detailní setup: [KUBB_SETUP.md](./KUBB_SETUP.md)
- Quick reference: [GENERATED_CODE_README.md](./GENERATED_CODE_README.md)
- OpenAPI spec: [../OPENAPI.md](../OPENAPI.md)
- Příklady API: [../API_EXAMPLES.rest](../API_EXAMPLES.rest)

## 🔄 Co je teď jinak

### Dříve (ručně psaný kód)
```typescript
// client/src/app/api.ts - 300+ řádků ručního kódu
class ApiClient {
  async getTasks() { ... }
  async createTask() { ... }
  async updateTask() { ... }
  // ... atd
}

// client/src/app/hooks.ts - 200+ řádků custom hooků
function useQuery() { ... }
function useMutation() { ... }
// ... atd
```

### Teď (generovaný kód)
```typescript
// client/src/app/api.ts - 30 řádků wrapperu
import { createApiClients } from '../gen'

export const apiClients = createApiClients()
export const apiClient = { ... } // backward compat

// client/src/app/hooks.ts - 50 řádků convenience hooků
export function useTasks(params) {
  return _useTasks(apiClients.tasks, params)
}
// ...

// Veškerý kód generován z openapi.yaml!
```

## ✅ Verification

TypeScript kontrola prošla bez chyb:
```
✓ Models jsou type-safe
✓ Hooks správně tipují data
✓ Zod schémata jsou validní
✓ Axios klienti jsou korektní
```

## 🎯 Příští kroky

1. ✅ Zkopírujte `openapi.yaml` do root adresáře (již hotovo)
2. ✅ Vytvořit `gen/` složku (již hotovo)
3. ✅ Nakonfigurovat Kubb (již hotovo)
4. ✅ Vytvořit wrapper soubory (již hotovo)
5. 📋 Volitelně: Instalovat Kubb CLI pro `npm run gen:api`
6. 📋 Volitelně: Nastavit Git hooks pro regenerování

## 📞 Potřebujete pomoc?

1. Podívejte se na [KUBB_SETUP.md](./KUBB_SETUP.md) - Detailní dokumentace
2. Spusťte `npx kubb generate --help`
3. Zkontrolujte OpenAPI specifikaci v [OPENAPI.md](../OPENAPI.md)
