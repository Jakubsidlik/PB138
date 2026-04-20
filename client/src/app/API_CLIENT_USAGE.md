# API Client Documentation

## Setup

API client je centralizovaný interface pro komunikaci s backendem. Nachází se v souboru `src/app/api.ts`.

### Konfigurace

Nastavit user ID po přihlášení:

```typescript
import { apiClient } from './app/api'

// Po přihlášení
apiClient.setUserId(userId)

// Po odhlášení
apiClient.setUserId(null)
```

### Environment variables

V souboru `.env`:
```
VITE_API_URL=http://localhost:5000
```

Pokud není nastaveno, defaultně používá `http://localhost:5000`.

---

## API Methods Reference

### Authentication

```typescript
import { apiClient } from './app/api'

// Register
const authResponse = await apiClient.register({
  fullName: 'Jan Nováček',
  email: 'jan@example.com',
  password: 'heslo123',
  school: 'Masarykova univerzita',
  faculty: 'FI',
})

// Login
const authResponse = await apiClient.login({
  email: 'jan@example.com',
  password: 'heslo123',
})
```

### Users & Profile

```typescript
// Get current user profile
const profile = await apiClient.getProfile()

// Update profile
await apiClient.updateProfile({
  fullName: 'Jan Nováček',
  bio: 'Nový bio text',
})

// Upload avatar (base64 data URL)
await apiClient.uploadAvatar('data:image/png;base64,...')

// Get all users (admin only)
const users = await apiClient.getUsers()

// Delete profile
await apiClient.deleteProfile()
```

### Study Plans

```typescript
// Get study plans (with pagination)
const response = await apiClient.getStudyPlans()
// response.data: StudyPlan[]
// response.hasMore: boolean
// response.nextCursor: string | null

// Create study plan
const plan = await apiClient.createStudyPlan({
  name: 'Informatika 3. ročník',
  description: 'Můj studijní plán',
  faculty: 'FI',
  startDate: '2024-09-01',
  endDate: '2025-06-30',
})

// Update study plan
await apiClient.updateStudyPlan(planId, {
  name: 'Nový název',
  isActive: false,
})

// Delete study plan
await apiClient.deleteStudyPlan(planId)

// Get collaborators
const collaborators = await apiClient.getStudyPlanCollaborators(planId)

// Share study plan
await apiClient.shareStudyPlan(planId, {
  email: 'friend@example.com',
  role: 'VIEWER', // nebo 'CONTRIBUTOR'
})

// Remove collaborator
await apiClient.removeStudyPlanCollaborator(planId, userId)
```

### Subjects

```typescript
// Get subjects
const response = await apiClient.getSubjects(studyPlanId)

// Create subject
const subject = await apiClient.createSubject({
  name: 'Lineární algebra',
  teacher: 'Doc. Petr Novák',
  code: 'MA1',
  studyPlanId: 1,
})

// Update subject
await apiClient.updateSubject(subjectId, {
  name: 'Lineární algebra I',
})

// Delete subject
await apiClient.deleteSubject(subjectId)
```

### Tasks

```typescript
// Get tasks
const response = await apiClient.getTasks(studyPlanId)

// Create task
const task = await apiClient.createTask({
  title: 'Vypracovat úkol 5',
  subjectId: 1,
  deadline: '2024-12-20',
})

// Update task
await apiClient.updateTask(taskId, {
  done: true,
  favorite: true,
})

// Archive task
await apiClient.archiveTask(taskId)

// Delete task
await apiClient.deleteTask(taskId)

// Update multiple tasks
await apiClient.updateTasksBatch([...tasks])

// Get archived tasks
const archived = await apiClient.getTaskArchive()
```

### Events

```typescript
// Get events
const response = await apiClient.getEvents(studyPlanId)

// Create event
const event = await apiClient.createEvent({
  title: 'Přednáška - Lineární algebra',
  date: '2024-12-15',
  time: '09:00',
  location: 'Budova A, místnost 101',
  recurrence: 'WEEKLY', // 'NONE', 'DAILY', 'WEEKLY', 'MONTHLY'
})

// Update event
await apiClient.updateEvent(eventId, {
  title: 'Nový název',
  date: '2024-12-16',
})

// Delete event
await apiClient.deleteEvent(eventId)

// Update multiple events
await apiClient.updateEventsBatch([...events])
```

### Files

```typescript
// Get files
const response = await apiClient.getFiles(studyPlanId)

// Create file
const file = await apiClient.createFile({
  name: 'script.js',
  addedLabel: 'Domácí úkol',
  subjectId: 1,
})

// Update file
await apiClient.updateFile(fileId, {
  name: 'script_v2.js',
})

// Delete file
await apiClient.deleteFile(fileId)

// Get public files
const publicFiles = await apiClient.getPublicFiles()

// Admin: Get files for moderation
const forModeration = await apiClient.getAdminFiles()

// Admin: Approve file
await apiClient.approveFile(fileId)

// Admin: Reject file
await apiClient.rejectFile(fileId, 'Obsahuje rozpracované kódy')
```

### File Comments

```typescript
// Get comments on file
const response = await apiClient.getFileComments(fileId)

// Create comment
const comment = await apiClient.createFileComment(fileId, {
  comment: 'Skvělá práce!',
})

// Update comment
await apiClient.updateFileComment(commentId, {
  comment: 'Aktualizovaný komentář',
})

// Delete comment
await apiClient.deleteFileComment(commentId)
```

### Lessons

```typescript
// Get lessons
const response = await apiClient.getLessons(studyPlanId)

// Create lesson
const lesson = await apiClient.createLesson({
  title: 'Úvod do Gitu',
  content: 'Markdown obsah lekce...',
  subjectId: 1,
})

// Update lesson
await apiClient.updateLesson(lessonId, {
  title: 'Úvod do Gitu v2',
  orderIndex: 2,
})

// Delete lesson
await apiClient.deleteLesson(lessonId)
```

### Lesson Notes

```typescript
// Get notes on lesson
const response = await apiClient.getLessonNotes(lessonId)

// Create note
const note = await apiClient.createLessonNote(lessonId, {
  note: 'Moje poznámka k lekci',
  isPinned: true,
})

// Update note
await apiClient.updateLessonNote(noteId, {
  note: 'Aktualizovaná poznámka',
})

// Delete note
await apiClient.deleteLessonNote(noteId)
```

### Annotations

```typescript
// Get annotations for content
const response = await apiClient.getAnnotations(targetId)

// Create annotation
const annotation = await apiClient.createAnnotation({
  targetType: 'LESSON', // 'LESSON' | 'LESSON_NOTE' | 'FILE_COMMENT'
  targetId: lessonId,
  startOffset: 10,
  endOffset: 25,
  selectedText: 'Important text',
  comment: 'Moje poznámka k tomuto textu',
})

// Delete annotation
await apiClient.deleteAnnotation(annotationId)
```

---

## Using React Hooks

Pro jednodušší integraci v Reactu, používejte custom hooks:

```typescript
import { useTasks, useEvents, useProfile, useMutation } from './app/hooks'

function MyComponent() {
  // Get data
  const { data: profile, loading, error } = useProfile()

  // Get tasks with mutations
  const { tasks, loading: tasksLoading, createTask } = useTasks(studyPlanId)

  // Create task
  const handleCreateTask = async () => {
    try {
      await createTask.mutate({
        title: 'Nový úkol',
        deadline: '2024-12-20',
      })
    } catch (err) {
      console.error('Chyba:', err)
    }
  }

  if (loading) return <div>Načítání...</div>
  if (error) return <div>Chyba: {error.message}</div>

  return (
    <div>
      <h1>{profile?.fullName}</h1>
      <button onClick={handleCreateTask} disabled={createTask.loading}>
        Vytvořit úkol
      </button>
    </div>
  )
}
```

Dostupné hooks:
- `useProfile()`
- `useStudyPlans()`
- `useSubjects(studyPlanId?)`
- `useTasks(studyPlanId?)`
- `useEvents(studyPlanId?)`
- `useFiles(studyPlanId?)`
- `useLessons(studyPlanId?)`
- `useLessonNotes(lessonId)`
- `useFileComments(fileId)`
- `useAnnotations(targetId)`
- `useUsers()`

---

## Error Handling

```typescript
try {
  const task = await apiClient.createTask({
    title: 'Úkol',
  })
} catch (error) {
  console.error('API Error:', error.message)
  // "fullName, email and password are required."
}
```

---

## Pagination

Některé endpointy vrací stránkované výsledky:

```typescript
const response = await apiClient.getStudyPlans()
// {
//   data: [...],
//   hasMore: true,
//   nextCursor: "123"
// }

// Načíst další stránku
const nextResponse = await apiClient.getStudyPlansPaginated(response.nextCursor)
```

Pro jednodušší práci s paginací, používejte `usePaginatedQuery`:

```typescript
const { data, hasMore, loadMore } = usePaginatedQuery(() => apiClient.getStudyPlans())

// Načíst další stránku
await loadMore()
```
