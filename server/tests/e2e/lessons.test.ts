import { describe, expect, it, mock } from 'bun:test'
import request from 'supertest'

mock.module('../../src/modules/lessons/lessons.services.js', () => ({
  lessonsService: {
    getLessons: mock(async () => []),
    createLesson: mock(async (_id: any, data: any) => ({ id: 555, ...data })),
    updateLesson: mock(async (_lId: any, _actor: any, data: any) => ({ id: 555, ...data })),
    deleteLesson: mock(async () => ({ success: true }))
  }
}))

mock.module('../../src/auth.js', () => ({
  requireRegisteredActor: async (req: any, res: any) => ({ id: 1, role: 'REGISTERED' }),
  getActorFromRequest: async () => ({ id: 1, role: 'REGISTERED' })
}))

import { app } from '../../src/index'
import { lessonsService } from '../../src/modules/lessons/lessons.services'

describe('Lessons API E2E', () => {
  describe('GET /api/lessons', () => {
    it('should return 200 and call getLessons', async () => {
      const response = await request(app).get('/api/lessons')
      expect(response.status).toBe(200)
      expect(lessonsService.getLessons).toHaveBeenCalled()
    })
  })

  describe('POST /api/lessons', () => {
    it('should return 201 on valid data', async () => {
      const response = await request(app).post('/api/lessons').send({
        title: 'Introduction to Algebra'
      })
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id', 555)
      expect(response.body).toHaveProperty('title', 'Introduction to Algebra')
    })

    it('should return 201 with default values', async () => {
      const response = await request(app).post('/api/lessons').send({
        title: 'Lesson 2'
      })
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('isShared', false)
      expect(response.body).toHaveProperty('orderIndex', 0)
    })

    it('should return 400 when title is missing', async () => {
      const response = await request(app).post('/api/lessons').send({
        content: 'No title here'
      })
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('PATCH /api/lessons/:id', () => {
    it('should return 200 on valid update', async () => {
      const response = await request(app).patch('/api/lessons/555').send({
        title: 'Updated Lesson'
      })
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('title', 'Updated Lesson')
    })

    it('should return 400 on invalid lesson ID', async () => {
      const response = await request(app).patch('/api/lessons/abc').send({
        title: 'Updated'
      })
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/lessons/:id', () => {
    it('should return 200 on valid delete', async () => {
      const response = await request(app).delete('/api/lessons/555')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })

    it('should return 400 on invalid ID', async () => {
      const response = await request(app).delete('/api/lessons/abc')
      expect(response.status).toBe(400)
    })
  })
})
