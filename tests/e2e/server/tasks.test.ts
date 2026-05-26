import { describe, expect, it, mock } from 'bun:test'
import request from 'supertest'

// Mock services to prevent hitting the real database
mock.module('../../../server/src/modules/tasks/tasks.services.js', () => ({
  tasksService: {
    getTasks: mock(async () => []),
    createTask: mock(async (_id: any, data: any) => ({ id: 999, ...data })),
    updateTask: mock(async (_id: any, _u: any, data: any) => ({ id: 999, ...data })),
    deleteTask: mock(async () => ({ success: true }))
  }
}))

mock.module('../../../server/src/auth.js', () => ({
  requireRegisteredActor: async (req: any, res: any) => ({ id: 1, role: 'REGISTERED' }),
  getActorFromRequest: async () => ({ id: 1, role: 'REGISTERED' })
}))

// Import app AFTER mocks
import { app } from '../../../server/src/index'
import { tasksService } from '../../../server/src/modules/tasks/tasks.services'

describe('Tasks API E2E', () => {
  it('GET /api/tasks should return 200', async () => {
    const response = await request(app).get('/api/tasks')
    expect(response.status).toBe(200)
    expect(tasksService.getTasks).toHaveBeenCalled()
  })

  it('POST /api/tasks should return 201 on valid data', async () => {
    const response = await request(app).post('/api/tasks').send({
      title: 'New Task',
      priority: 'HIGH'
    })
    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('id', 999)
    expect(response.body).toHaveProperty('title', 'New Task')
  })

  it('POST /api/tasks should return 400 when validation fails (missing title)', async () => {
    const response = await request(app).post('/api/tasks').send({
      priority: 'HIGH'
    })
    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
  })

  it('PATCH /api/tasks/:id should return 200 on valid update', async () => {
    const response = await request(app).patch('/api/tasks/999').send({
      title: 'Updated Task'
    })
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('title', 'Updated Task')
  })

  it('DELETE /api/tasks/:id should return 200', async () => {
    const response = await request(app).delete('/api/tasks/999')
    expect(response.status).toBe(200)
  })
})
