# TanStack Query Integration Guide

## Přehled

Aplikace nyní používá **TanStack Query v5** pro správu serverového stavu s automatickou synchronizací dat, caching a validací.

## Architektura

```
API Client (apiClients.tasks, apiClients.subjects)
         ↓
API Hooks (useTasks, useCreateTask, etc.) - src/app/api-hooks.ts
         ↓
QueryClient + QueryClientProvider - src/app/queries.ts
         ↓
Route Loaders - prefetch data před renderem
         ↓
Components - use hooks pro display a mutations
```

## Konfigurace

### QueryClient (`src/app/queries.ts`)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // Data se stane "starou" po 5 minutách
      gcTime: 1000 * 60 * 10,          // Zapomene data po 10 minutách
      retry: 1,                         // Zkusit znovu jednou při selhání
      refetchOnWindowFocus: true,       // Znovu načíst při návratu do okna
    },
  },
})
```

### Query Keys (`src/app/queries.ts`)

```typescript
export const queryKeys = {
  all: ['app'],
  tasks: ['app', 'tasks'],
  task: (id: number) => ['app', 'tasks', id],
  subjects: ['app', 'subjects'],
  subject: (id: number) => ['app', 'subjects', id],
  events: ['app', 'events'],
  // ...
}
```

Query keys určují strukturu cache - stejný key = stejná data v cache.

## API Hooks (`src/app/api-hooks.ts`)

### Query Hooks - Čtení dat

#### Tasks - Seznam úkolů
```typescript
const { data: tasks, isLoading, error } = useTasks()
```

#### Single Task - Jeden úkol
```typescript
const { data: task, isLoading, error } = useTask(taskId)
```

#### Subjects - Seznam předmětů
```typescript
const { data: subjects, isLoading, error } = useSubjects()
```

### Mutation Hooks - Úpravy dat

#### Vytvořit úkol
```typescript
const createMutation = useCreateTask()

// Použití:
createMutation.mutate({
  title: 'Můj nový úkol',
  description: 'Popis...',
  done: false,
})

// Sledování stavu
if (createMutation.isPending) console.log('Vytváří se...')
if (createMutation.isError) console.error(createMutation.error)
if (createMutation.isSuccess) console.log('Úspěšně vytvořeno!')
```

#### Aktualizovat úkol
```typescript
const updateMutation = useUpdateTask()

updateMutation.mutate({
  id: 1,
  payload: { title: 'Updated title', done: true },
})
```

#### Smazat úkol
```typescript
const deleteMutation = useDeleteTask()

deleteMutation.mutate(taskId)
```

#### Přepnout completion status
```typescript
const toggleMutation = useToggleTask()

toggleMutation.mutate(taskId) // Automaticky změní done: false -> true
```

### Subjects Mutations
```typescript
useCreateSubject()  // Vytvoří předmět
useUpdateSubject()  // Aktualizuje předmět
useDeleteSubject()  // Smaže předmět
```

## Invalidace Cache (Data Synchronization)

Když se data změní (mutace), musíme říci QueryClient, aby data v cache označil jako zastaralá a znovu je načetl.

### Automatická invalidace

V hooku se už stará o invalidaci - je v `onSuccess` callbacku:

```typescript
export function useDeleteTask() {
  return useMutation({
    mutationFn: (id) => apiClients.tasks.delete(id),
    onSuccess: () => {
      // Automaticky se znovu načtou všechny úkoly
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}
```

### Manuální invalidace

Pokud potřebuješ vyzvat aktualizaci dat ručně:

```typescript
import { queryClient, queryKeys } from '@/app/queries'

// Označit všechny úkoly jako zastaralé
await queryClient.invalidateQueries({ queryKey: queryKeys.tasks })

// Označit konkrétní úkol
await queryClient.invalidateQueries({ queryKey: queryKeys.task(1) })
```

## Route Loaders - Prefetching

Loader je funkce která se spustí **před** renderem komponenty a zajistí, že data jsou v cache.

### Příklad - tasks/index.tsx

```typescript
async function tasksLoader() {
  // Zajistit, že tasks jsou v cache dřív než se komponenta renderuje
  return queryClient.ensureQueryData({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const result = await apiClients.tasks.list()
      return Array.isArray(result) ? result : []
    },
  })
}

export const Route = createRoute({
  path: '/tasks',
  component: TasksComponent,
  loader: tasksLoader, // Loader se spustí před renderem
})
```

**Výhody:**
- ✅ Žádné loading spinner - data jsou připravena
- ✅ Komponenta se renderuje s daty
- ✅ Lepší UX a výkon

## Migrace ze starého kódu

### Staré (useDashboardState):
```typescript
function TasksComponent() {
  const state = useDashboardState()
  
  return (
    <DesktopTasksScreen
      tasks={state.tasks}
      toggleTask={state.toggleTask}
      deleteTask={state.deleteTask}
    />
  )
}
```

### Nové (TanStack Query):
```typescript
function TasksComponent() {
  const { data: tasks = [] } = useTasks()
  const toggleMutation = useToggleTask()
  const deleteMutation = useDeleteTask()

  return (
    <DesktopTasksScreen
      tasks={tasks}
      toggleTask={(id) => toggleMutation.mutate(id)}
      deleteTask={(id) => deleteMutation.mutate(id)}
    />
  )
}
```

## Autentifikace API

API autentifikace je nastavena v `App.tsx`. Interceptor přidává Clerk token do všech requestů:

```typescript
// App.tsx
React.useEffect(() => {
  if (!isSignedIn) return

  const unsubscribe = apiClients.axios.interceptors.request.use(
    async (config) => {
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )
}, [isSignedIn, getToken])
```

## Testování

```typescript
// Mock hook
vi.mock('@/app/api-hooks', () => ({
  useTasks: vi.fn(() => ({
    data: [{ id: 1, title: 'Test' }],
    isLoading: false,
    error: null,
  })),
}))

// Test component
it('renders tasks', () => {
  render(<TasksComponent />)
  expect(screen.getByText('Test')).toBeInTheDocument()
})
```

## Best Practices

1. **Vždy používej query keys** - Umožňuje efektivní caching a invalidaci
2. **Parametrizuj queries** - `useTask(id)` místo `useTaskById`
3. **Invaliduj pouze to co se změnilo** - `invalidateQueries({ queryKey: queryKeys.tasks })` ne všechno
4. **Používej loaders** - Prefetch data pro lepší UX
5. **Handle errors** - Zkontroluj `isError` a `error` state v mutacích
6. **Sleduj loading states** - Pokaž spinneruž u mutací

## Příklady - Komplexní Případ

### Form se submission

```typescript
function CreateTaskForm() {
  const [title, setTitle] = React.useState('')
  const createMutation = useCreateTask()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(
      { title, description: '', done: false },
      {
        onSuccess: () => {
          setTitle('') // Vyčisti form
          // Cache je automaticky invalidován v mutation hooku
        },
        onError: (error) => {
          console.error('Chyba při vytváření:', error)
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={createMutation.isPending}
      />
      <button disabled={createMutation.isPending} type="submit">
        {createMutation.isPending ? 'Vytváří se...' : 'Vytvořit'}
      </button>
      {createMutation.isError && (
        <p style={{ color: 'red' }}>{createMutation.error.message}</p>
      )}
    </form>
  )
}
```

## Debugging

Nainstaluj [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools):

```bash
npm install @tanstack/react-query-devtools
```

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

Viz cache, network requesty, a query states v reálném čase.

## Migrace na API - Kroky

1. ✅ QueryClient nastaven (`src/app/queries.ts`)
2. ✅ QueryClientProvider obaluje app (`App.tsx`)
3. ✅ API hooks vytvořeny (`src/app/api-hooks.ts`)
4. ✅ Autentifikace nastavena (Clerk token v requestech)
5. ✅ Route loadery aktualizovány
6. 📋 Zbývá: Aktualizovat zbylé komponenty
7. 📋 Zbývá: Testování s live API

## Zbývající Úkoly

- [ ] Aktualizovat `src/routes/_authenticated/calendar.tsx` na API
- [ ] Aktualizovat `src/routes/_authenticated/tasks/$taskId.tsx` na API
- [ ] Aktualizovat komponenty pro subjects (pokud existují)
- [ ] Přidat error handling a retry logiku
- [ ] Nastavit DevTools pro debugging
- [ ] Otestovat s live API

## Příslušné Soubory

- `src/app/queries.ts` - QueryClient a query keys
- `src/app/api-hooks.ts` - Custom hooks s mutacemi
- `src/app/api.ts` - API client setup (vygenerováno)
- `src/App.tsx` - QueryClientProvider + auth interceptor
- `src/routes/*/index.tsx` - Route loaders a komponenty
