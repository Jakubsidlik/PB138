# TanStack Query - Praktické Příklady

## 1. Komponenta s Query Hook (Čtení dat)

### Staré - useDashboardState
```typescript
import { useDashboardState } from '@/app/useDashboardState'

function TasksComponent() {
  const state = useDashboardState()

  return (
    <div>
      <h1>Úkoly ({state.tasks.length})</h1>
      <ul>
        {state.tasks.map(task => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Nové - TanStack Query
```typescript
import { useTasks } from '@/app/api-hooks'

function TasksComponent() {
  const { data: tasks = [], isLoading, error } = useTasks()

  if (isLoading) return <div>Načítám...</div>
  if (error) return <div>Chyba: {error.message}</div>

  return (
    <div>
      <h1>Úkoly ({tasks.length})</h1>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

## 2. Komponenta s Mutací (Vytvoření)

### Staré - useDashboardState
```typescript
function CreateTaskForm() {
  const [title, setTitle] = React.useState('')
  const state = useDashboardState()
  const [loading, setLoading] = React.useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      await state.addTask(title)
      setTitle('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input value={title} onChange={e => setTitle(e.target.value)} />
      <button onClick={handleCreate} disabled={loading}>
        {loading ? 'Vytváří se...' : 'Vytvořit'}
      </button>
    </div>
  )
}
```

### Nové - TanStack Query
```typescript
import { useCreateTask } from '@/app/api-hooks'

function CreateTaskForm() {
  const [title, setTitle] = React.useState('')
  const createMutation = useCreateTask()

  const handleCreate = () => {
    createMutation.mutate(
      {
        title,
        description: '',
        done: false,
      },
      {
        onSuccess: () => {
          setTitle('') // Clear form after success
          // Cache je automaticky invalidován - data se znovu načtou
        },
      }
    )
  }

  return (
    <div>
      <input 
        value={title} 
        onChange={e => setTitle(e.target.value)}
        disabled={createMutation.isPending}
      />
      <button onClick={handleCreate} disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Vytváří se...' : 'Vytvořit'}
      </button>
      {createMutation.isError && (
        <p style={{ color: 'red' }}>
          Chyba: {createMutation.error?.message}
        </p>
      )}
    </div>
  )
}
```

## 3. Komponenta s Toggle/Update Mutací

### Staré
```typescript
function TaskItem({ task }) {
  const state = useDashboardState()

  return (
    <div>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => state.toggleTask(task.id)}
      />
      <span>{task.title}</span>
    </div>
  )
}
```

### Nové
```typescript
import { useToggleTask } from '@/app/api-hooks'

function TaskItem({ task }) {
  const toggleMutation = useToggleTask()

  const handleToggle = () => {
    toggleMutation.mutate(task.id)
  }

  return (
    <div>
      <input
        type="checkbox"
        checked={task.done}
        onChange={handleToggle}
        disabled={toggleMutation.isPending}
      />
      <span style={task.done ? { textDecoration: 'line-through' } : {}}>
        {task.title}
      </span>
    </div>
  )
}
```

## 4. Komponenta s Delete Mutací

### Nové
```typescript
import { useDeleteTask } from '@/app/api-hooks'

function TaskItem({ task, onDelete }) {
  const deleteMutation = useDeleteTask()

  const handleDelete = () => {
    if (confirm(`Smazat "${task.title}"?`)) {
      deleteMutation.mutate(task.id, {
        onSuccess: () => {
          onDelete?.(task.id)
          // Cache je automaticky invalidován
        },
      })
    }
  }

  return (
    <div>
      <span>{task.title}</span>
      <button onClick={handleDelete} disabled={deleteMutation.isPending}>
        {deleteMutation.isPending ? 'Maže se...' : 'Smazat'}
      </button>
      {deleteMutation.isError && (
        <p style={{ color: 'red' }}>Chyba při mazání</p>
      )}
    </div>
  )
}
```

## 5. Komponenta s Updatou (Edit Form)

### Nové
```typescript
import { useUpdateTask } from '@/app/api-hooks'

function EditTaskForm({ task, onClose }) {
  const [title, setTitle] = React.useState(task.title)
  const [description, setDescription] = React.useState(task.description || '')
  const updateMutation = useUpdateTask()

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate(
      {
        id: task.id,
        payload: { title, description },
      },
      {
        onSuccess: () => {
          onClose?.()
          // Cache se automaticky invaliduje
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={updateMutation.isPending}
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        disabled={updateMutation.isPending}
      />
      <button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Ukládám...' : 'Uložit'}
      </button>
      {updateMutation.isError && (
        <p style={{ color: 'red' }}>Chyba: {updateMutation.error?.message}</p>
      )}
    </form>
  )
}
```

## 6. Route Loader - Data Prefetch

### Staré
```typescript
async function tasksLoader() {
  return queryClient.ensureQueryData({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      const { readTasksFromStorage } = await import('@/app/storage')
      return readTasksFromStorage() ?? []
    },
  })
}
```

### Nové - S API
```typescript
async function tasksLoader() {
  return queryClient.ensureQueryData({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const result = await apiClients.tasks.list()
      return Array.isArray(result) ? result : []
    },
  })
}
```

## 7. Kombinace - Tasks List se všemi operacemi

```typescript
import { useTasks, useCreateTask, useToggleTask, useDeleteTask, useUpdateTask } from '@/app/api-hooks'

function TasksScreen() {
  const { data: tasks = [], isLoading, error } = useTasks()
  const createMutation = useCreateTask()
  const toggleMutation = useToggleTask()
  const deleteMutation = useDeleteTask()
  const updateMutation = useUpdateTask()
  
  const [newTaskTitle, setNewTaskTitle] = React.useState('')
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editingTitle, setEditingTitle] = React.useState('')

  const handleAddTask = () => {
    createMutation.mutate({
      title: newTaskTitle,
      description: '',
      done: false,
    })
    setNewTaskTitle('')
  }

  const handleToggle = (id: number) => {
    toggleMutation.mutate(id)
  }

  const handleDelete = (id: number) => {
    if (confirm('Smazat úkol?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSaveEdit = () => {
    if (editingId) {
      updateMutation.mutate(
        {
          id: editingId,
          payload: { title: editingTitle },
        },
        {
          onSuccess: () => {
            setEditingId(null)
            setEditingTitle('')
          },
        }
      )
    }
  }

  if (isLoading) return <div>Načítám úkoly...</div>
  if (error) return <div>Chyba: {error.message}</div>

  return (
    <div className="tasks-container">
      <h1>Úkoly ({tasks.length})</h1>

      {/* Přidat nový úkol */}
      <div className="add-task">
        <input
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          placeholder="Nový úkol..."
          disabled={createMutation.isPending}
        />
        <button
          onClick={handleAddTask}
          disabled={createMutation.isPending || !newTaskTitle}
        >
          {createMutation.isPending ? 'Vytváří se...' : 'Přidat'}
        </button>
        {createMutation.isError && (
          <p style={{ color: 'red' }}>{createMutation.error?.message}</p>
        )}
      </div>

      {/* Seznam úkolů */}
      <ul className="tasks-list">
        {tasks.map(task => (
          <li key={task.id} className={task.done ? 'done' : ''}>
            {editingId === task.id ? (
              // Edit mode
              <>
                <input
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  disabled={updateMutation.isPending}
                />
                <button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  Uložit
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  disabled={updateMutation.isPending}
                >
                  Zrušit
                </button>
              </>
            ) : (
              // View mode
              <>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => handleToggle(task.id)}
                  disabled={toggleMutation.isPending}
                />
                <span onClick={() => {
                  setEditingId(task.id)
                  setEditingTitle(task.title)
                }}>
                  {task.title}
                </span>
                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={deleteMutation.isPending}
                >
                  Smazat
                </button>
              </>
            )}
            {updateMutation.isError && (
              <p style={{ color: 'red' }}>Chyba: {updateMutation.error?.message}</p>
            )}
          </li>
        ))}
      </ul>

      {tasks.length === 0 && (
        <p className="empty-state">Žádné úkoly. Přidej si nový! 🎉</p>
      )}
    </div>
  )
}

export default TasksScreen
```

## 8. Custom Hook - Multiple Mutations

Pokud potřebuješ koordinovat více mutací:

```typescript
function useTaskActions() {
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()
  const deleteMutation = useDeleteTask()
  const toggleMutation = useToggleTask()

  return {
    create: (payload) => createMutation.mutate(payload),
    update: (id, payload) => updateMutation.mutate({ id, payload }),
    delete: (id) => deleteMutation.mutate(id),
    toggle: (id) => toggleMutation.mutate(id),
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || toggleMutation.isPending,
  }
}

// Použití
function MyComponent() {
  const { create, update, delete: deleteTask, isLoading } = useTaskActions()

  return (
    <div>
      {isLoading && <span>Synchronizuji...</span>}
      <button onClick={() => create({ title: 'New' })}>
        Vytvořit
      </button>
    </div>
  )
}
```

## Key Takeaways

1. **Query Hook** - `useTasks()` pro čtení (GET)
2. **Mutation Hook** - `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()` pro zápis
3. **isPending** - True při běhu mutace
4. **isError / error** - Chyba informace
5. **onSuccess** - Callback po úspěšné mutaci (cleanup, navigace)
6. **Automatická invalidace** - Data v cache se automaticky znovu načtou
7. **Route Loader** - Prefetch data pro lepší UX
