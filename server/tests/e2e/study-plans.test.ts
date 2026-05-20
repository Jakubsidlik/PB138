import { describe, expect, it, mock } from 'bun:test'
import request from 'supertest'

mock.module('../../src/modules/study-plans/study-plans.services.js', () => ({
  studyPlansService: {
    getStudyPlans: mock(async () => []),
    createStudyPlan: mock(async (_id: any, data: any) => ({ id: 777, ...data })),
    updateStudyPlan: mock(async (_spId: any, _actor: any, data: any) => ({ id: 777, ...data })),
    deleteStudyPlan: mock(async () => ({ success: true })),
    getCollaborators: mock(async () => []),
    shareStudyPlan: mock(async () => ({ success: true })),
    unshareStudyPlan: mock(async () => ({ success: true }))
  }
}))

mock.module('../../src/auth.js', () => ({
  requireRegisteredActor: async (req: any, res: any) => ({ id: 1, role: 'REGISTERED' }),
  requireAdmin: async (req: any, res: any) => ({ id: 1, role: 'ADMIN' }),
  getActorFromRequest: async () => ({ id: 1, role: 'REGISTERED' })
}))

import { app } from '../../src/index.js'
import { studyPlansService } from '../../src/modules/study-plans/study-plans.services.js'

describe('Study Plans API E2E', () => {
  describe('GET /api/study-plans', () => {
    it('should return 200 and call getStudyPlans', async () => {
      const response = await request(app).get('/api/study-plans')
      expect(response.status).toBe(200)
      expect(studyPlansService.getStudyPlans).toHaveBeenCalled()
    })
  })

  describe('POST /api/study-plans', () => {
    it('should return 201 on valid data', async () => {
      const response = await request(app).post('/api/study-plans').send({
        name: 'Semester Plan',
        description: 'Spring 2024'
      })
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id', 777)
      expect(response.body).toHaveProperty('name', 'Semester Plan')
    })

    it('should return 400 when name is missing', async () => {
      const response = await request(app).post('/api/study-plans').send({
        description: 'No name'
      })
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return 400 when name is empty/whitespace', async () => {
      const response = await request(app).post('/api/study-plans').send({
        name: '   '
      })
      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /api/study-plans/:id', () => {
    it('should return 200 on valid update', async () => {
      const response = await request(app).patch('/api/study-plans/777').send({
        name: 'Updated Plan'
      })
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('name', 'Updated Plan')
    })

    it('should return 400 on invalid ID', async () => {
      const response = await request(app).patch('/api/study-plans/abc').send({
        name: 'Updated'
      })
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/study-plans/:id', () => {
    it('should return 200 on valid delete', async () => {
      const response = await request(app).delete('/api/study-plans/777')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })

    it('should return 400 on invalid ID', async () => {
      const response = await request(app).delete('/api/study-plans/abc')
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/study-plans/:id/collaborators', () => {
    it('should return 200', async () => {
      const response = await request(app).get('/api/study-plans/777/collaborators')
      expect(response.status).toBe(200)
      expect(studyPlansService.getCollaborators).toHaveBeenCalled()
    })
  })

  describe('POST /api/study-plans/:id/share', () => {
    it('should return 201 on valid share', async () => {
      const response = await request(app).post('/api/study-plans/777/share').send({
        email: 'friend@example.com',
        role: 'VIEWER'
      })
      expect(response.status).toBe(201)
    })

    it('should return 400 when email is missing', async () => {
      const response = await request(app).post('/api/study-plans/777/share').send({
        role: 'VIEWER'
      })
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/study-plans/:id/share/:userId', () => {
    it('should return 200 on valid unshare', async () => {
      const response = await request(app).delete('/api/study-plans/777/share/2')
      expect(response.status).toBe(200)
    })

    it('should return 400 on invalid IDs', async () => {
      const response = await request(app).delete('/api/study-plans/abc/share/def')
      expect(response.status).toBe(400)
    })
  })
})
