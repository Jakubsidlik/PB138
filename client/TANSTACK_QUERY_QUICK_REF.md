# TanStack Query - Quick Reference

## Import Hooks

```typescript
import {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTask,
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from '@/app/api-hooks'

import { queryClient, queryKeys } from '@/app/queries'
```

## Reading Data (Queries)

```typescript
// List all tasks
const { data: tasks = [], isLoading, error } = useTasks()

// Single task by ID
const { data: task } = useTask(1)

// List subjects
const { data: subjects = [] } = useSubjects()
```

## Writing Data (Mutations)

```typescript
// Create
const create = useCreateTask()
create.mutate({ title: 'Task', description: '', done: false })

// Update
const update = useUpdateTask()
update.mutate({ id: 1, payload: { title: 'Updated' } })

// Delete
const del = useDeleteTask()
del.mutate(1)

// Toggle completion
const toggle = useToggleTask()
toggle.mutate(1)
```

## Mutation States

```typescript
const mutation = useCreateTask()

mutation.isPending      // Currently executing
mutation.isSuccess      // Succeeded
mutation.isError        // Failed
mutation.error          // Error object if failed
mutation.data           // Returned data
```

## Callbacks

```typescript
mutation.mutate(
  { title: 'Task' },
  {
    onSuccess: (data) => {
      console.log('Success:', data)
      // Cache is automatically invalidated
    },
    onError: (error) => {
      console.error('Error:', error)
    },
    onSettled: () => {
      console.log('Done')
    },
  }
)
```

## Manual Cache Invalidation

```typescript
import { queryClient, queryKeys } from '@/app/queries'

// Invalidate all tasks
await queryClient.invalidateQueries({ queryKey: queryKeys.tasks })

// Invalidate specific task
await queryClient.invalidateQueries({ queryKey: queryKeys.task(1) })

// Invalidate subjects
await queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
```

## Prefetch in Loaders

```typescript
async function loader() {
  return queryClient.ensureQueryData({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const result = await apiClients.tasks.list()
      return Array.isArray(result) ? result : []
    },
  })
}
```

## Component Pattern

```typescript
function MyComponent() {
  // Read
  const { data, isLoading, error } = useTasks()
  
  // Write
  const mutation = useCreateTask()

  if (isLoading) return <Spinner />
  if (error) return <Error error={error} />

  return (
    <>
      {data.map(item => <Item key={item.id} {...item} />)}
      <button
        onClick={() => mutation.mutate({ title: 'New' })}
        disabled={mutation.isPending}
      >
        Add
      </button>
    </>
  )
}
```

## Common Patterns

### Form with Submit
```typescript
const [title, setTitle] = useState('')
const mutation = useCreateTask()

const handle = (e) => {
  e.preventDefault()
  mutation.mutate({ title }, {
    onSuccess: () => setTitle('')
  })
}

<form onSubmit={handle}>
  <input value={title} onChange={e => setTitle(e.target.value)} />
  <button disabled={mutation.isPending}>
    {mutation.isPending ? 'Creating...' : 'Add'}
  </button>
</form>
```

### List with Actions
```typescript
const { data: items } = useTasks()
const update = useUpdateTask()
const del = useDeleteTask()

{items.map(item => (
  <div key={item.id}>
    <span>{item.title}</span>
    <button onClick={() => update.mutate({ id: item.id, payload: { done: !item.done } })}>
      Toggle
    </button>
    <button onClick={() => del.mutate(item.id)}>
      Delete
    </button>
  </div>
))}
```

## Troubleshooting

**Data not updating after mutation?**
- Check that cache invalidation is in onSuccess
- Verify queryKey matches between query and invalidation

**Infinite loading?**
- Check if loader is properly set up
- Verify API returns array not paginated object

**Type errors with generated models?**
- Import types from `@/gen/models`
- Ensure API client is properly initialized

## For More Info

See:
- `TANSTACK_QUERY_INTEGRATION.md` - Full guide
- `TANSTACK_QUERY_EXAMPLES.md` - Real code examples
- `src/app/api-hooks.ts` - Hook implementations
- `src/app/queries.ts` - Query client setup
