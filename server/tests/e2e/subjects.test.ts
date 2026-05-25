import { describe, expect, it, mock } from 'bun:test'
import request from 'supertest'

mock.module('../../src/modules/subjects/subjects.services.js', () => ({
  subjectsService: {
    getSubjects: mock(async () => []),
    createSubject: mock(async (_actor: any, data: any) => ({ id: 666, ...data })),
    updateSubject: mock(async (_sId: any, _actor: any, data: any) => ({ id: 666, ...data })),
    deleteSubject: mock(async () => ({ success: true }))
  }
}))

mock.module('../../src/auth.js', () => ({
  requireRegisteredActor: async (req: any, res: any) => ({ id: 1, role: 'REGISTERED' }),
  getActorFromRequest: async () => ({ id: 1, role: 'REGISTERED' })
}))

import { app } from '../../src/index'
import { subjectsService } from '../../src/modules/subjects/subjects.services'

describe('Subjects API E2E', () => {
  describe('GET /api/subjects', () => {
    it('should return 200 and call getSubjects', async () => {
      const response = await request(app).get('/api/subjects')
      expect(response.status).toBe(200)
      expect(subjectsService.getSubjects).toHaveBeenCalled()
    })
  })

  describe('POST /api/subjects', () => {
    it('should return 201 on valid data', async () => {
      const response = await request(app).post('/api/subjects').send({
        name: 'Mathematics',
        code: 'MATH101',
        teacher: 'Dr. Smith'
      })
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id', 666)
      expect(response.body).toHaveProperty('name', 'Mathematics')
    })

    it('should return 400 when code is missing', async () => {
      const response = await request(app).post('/api/subjects').send({
        name: 'Mathematics'
      })
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return 400 when name is missing', async () => {
      const response = await request(app).post('/api/subjects').send({
        code: 'MATH101'
      })
      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/subjects/:id', () => {
    it('should return 200 on valid update', async () => {
      const response = await request(app).put('/api/subjects/666').send({
        name: 'Updated Subject'
      })
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('name', 'Updated Subject')
    })

    it('should return 400 on invalid subject ID', async () => {
      const response = await request(app).put('/api/subjects/abc').send({
        name: 'Updated'
      })
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/subjects/:id', () => {
    it('should return 200 on valid delete', async () => {
      const response = await request(app).delete('/api/subjects/666')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })

    it('should return 400 on invalid ID', async () => {
      const response = await request(app).delete('/api/subjects/abc')
      expect(response.status).toBe(400)
    })
  })
})
