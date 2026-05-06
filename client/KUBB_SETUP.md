# Kubb Code Generation - Setup & Workflow

## 📋 Přehled

Projekt používá **Kubb** pro automatické generování TypeScript kódu z OpenAPI specifikace (`openapi.yaml`).

Tento přístup:
- ✅ Eliminuje manuální API volání
- ✅ Zajišťuje konzistenci mezi frontend a backend
- ✅ Generuje Zod schémata pro validaci
- ✅ Poskytuje TanStack Query hooky pro data fetching
- ✅ Snižuje boilerplate kód

## 📁 Struktura generovaného kódu

```
client/src/gen/
├── models/              # TypeScript type definitions
│   ├── task.ts         # Task related types
│   ├── subject.ts      # Subject related types
│   └── index.ts        # Re-exports
├── zod/                # Zod validation schemas
│   ├── task.ts         # Task schemas (CreateTaskRequest, UpdateTaskRequest, etc.)
│   ├── subject.ts      # Subject schemas
│   └── index.ts        # Re-exports
├── client/             # Axios API clients
│   ├── index.ts        # Factory function createApiClients()
│   ├── tasks-client.ts # TasksClient class
│   └── subjects-client.ts # SubjectsClient class
├── hooks/              # TanStack Query hooks
│   ├── use-tasks.ts    # useTasks, useCreateTask, useUpdateTask, etc.
│   ├── use-subjects.ts # useSubjects, useCreateSubject, etc.
│   └── index.ts        # Re-exports
└── index.ts            # Main entry point
```

## 🔧 Kubb Konfigurace

Soubor: `client/kubb.config.ts`

```typescript
export default defineConfig({
  root: '.',
  input: {
    path: '../openapi.yaml',  // OpenAPI zdroj
  },
  output: {
    path: './src/gen',        // Výstupní složka
    clean: true,              // Vyčistit před generováním
    barrelFiles: true,        // Vytvořit index.ts
  },
  plugins: [
    pluginTs(),               // TypeScript type definitions
    pluginZod(),              // Zod validation schemas
    pluginClient({            // Axios client
      client: 'axios',
      baseURL: 'http://localhost:3000'
    }),
    pluginReactQuery({        // TanStack Query hooks
      infinite: { enabled: true } // Infinite query support
    })
  ],
})
```

## 🚀 Workflow

### 1. Aktualizovat OpenAPI specifikaci

Pokud přidáte nový endpoint:

```yaml
paths:
  /api/tasks:
    get:
      summary: Get all tasks
      # ... detaily endpointu
```

### 2. Spustit Kubb generování

```bash
cd client
npx kubb generate
```

Nebo přidat do `package.json`:

```json
{
  "scripts": {
    "gen:api": "kubb generate"
  }
}
```

### 3. Importovat generovaný kód

#### Option A: Přímý import z gen/

```typescript
import { useTasks, useCreateTask } from '../gen/hooks'
import { TasksClient } from '../gen/client'
import type { Task, CreateTaskRequest } from '../gen/models'
```

#### Option B: Convenience wrapper (doporučeno)

```typescript
import { useTasks, useCreateTask } from './hooks'
import { apiClient } from './api'
import type { Task, CreateTaskRequest } from './api'
```

## 📝 Příklady použití

### Fetching data s React Query

```typescript
import { useTasks } from './hooks'

function TaskList() {
  const { data, isLoading, error } = useTasks({
    subjectId: 42,
    done: false,
  })

  if (isLoading) return <div>Načítám...</div>
  if (error) return <div>Chyba: {error.message}</div>

  return (
    <ul>
      {(data?.data || data)?.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

### Vytvoření úkolu

```typescript
import { useCreateTask } from './hooks'

function CreateTaskForm() {
  const { mutate, isPending } = useCreateTask()

  const handleSubmit = async (title: string) => {
    await mutate({
      title,
      done: false,
    })
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit(e.currentTarget.title.value)
    }}>
      <input name="title" required />
      <button disabled={isPending}>Vytvořit</button>
    </form>
  )
}
```

### Validace pomocí Zod

```typescript
import { createTaskRequestSchema } from '../gen/zod'

// Validovat data
const result = createTaskRequestSchema.safeParse({
  title: 'Nový úkol',
  done: false,
})

if (!result.success) {
  console.error('Validační chyba:', result.error)
} else {
  console.log('Validní data:', result.data)
}
```

### Přímý Axios klient

```typescript
import { apiClients } from './api'

// Bez React Query
const task = await apiClients.tasks.create({
  title: 'Quick task',
  done: false,
})

const tasks = await apiClients.tasks.list({
  subjectId: 42,
  paginated: true,
  limit: 20,
})
```

### Infinite Query s paginací

```typescript
import { useTasksInfinite } from './hooks'

function TaskScroll() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTasksInfinite({
    subjectId: 42,
  })

  const allTasks = data?.pages.flatMap((page) => page.data) || []

  return (
    <div>
      {allTasks.map((task) => (
        <div key={task.id}>{task.title}</div>
      ))}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          Načíst více
        </button>
      )}
    </div>
  )
}
```

## 🔄 Update workflow

Když se změní API:

1. **Aktualizujte `openapi.yaml`** v root adresáři
2. **Spusťte `npx kubb generate`** v `client/`
3. **Commit nové soubory** v `client/src/gen/`
4. **Komponenty se automaticky updatují** (TypeScript error checking)

## ⚡ Best practices

### 1. Vždy generujte z OpenAPI

Nepisujte ručně API klienty - generujte!

```typescript
// ❌ Neměnit ručně
export class TasksClient { ... }

// ✅ Generuje se z openapi.yaml
```

### 2. Zachovávejte wrapper soubory

- `client/src/app/api.ts` - Singleton instance
- `client/src/app/hooks.ts` - Convenience hooks

Tyto soubory zůstávají stabilní a exportují generovaný kód.

### 3. Typová bezpečnost

Zod schémata se automaticky generují, takže máte runtime validaci:

```typescript
const data = createTaskRequestSchema.parse(userInput)
```

### 4. Invalidace cache

Při mutaci invalidujte cache:

```typescript
const { mutate } = useCreateTask()

mutate(newTask, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})
```

## 📚 Další čtení

- [Kubb Documentation](https://kubb.dev)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.0)
- [TanStack Query](https://tanstack.com/query)
- [Zod Validation](https://zod.dev)
- [Axios HTTP Client](https://axios-http.com)

## 🐛 Troubleshooting

### Kubb se nespustí

```bash
# Ujistěte se, že máte openapi.yaml v root adresáři
ls ../openapi.yaml

# Instalace Kubb
npm install -D @kubb/cli @kubb/core @kubb/plugin-ts @kubb/plugin-zod @kubb/plugin-react-query @kubb/plugin-client
```

### Typy se negenerují správně

```bash
# Vyčistit cache a regenerovat
rm -rf src/gen
npx kubb generate
```

### Import chyby

```typescript
// ✅ Správně
import { useTasks } from './hooks'
import { useTasks } from '../gen/hooks'

// ❌ Špatně
import { useTasks } from './gen' // gen je soubor/složka, ne entrypoint
```
