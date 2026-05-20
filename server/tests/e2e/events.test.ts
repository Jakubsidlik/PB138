import { describe, expect, it, mock } from 'bun:test'
import request from 'supertest'

mock.module('../../src/modules/events/events.services.js', () => ({
  eventsService: {
    getEvents: mock(async () => []),
    createEvent: mock(async (_id: any, data: any) => ([{ id: 888, title: data.title, date: data.date }])),
    updateEvent: mock(async (_eId: any, _aId: any, data: any) => ({ id: 888, ...data })),
    deleteEvent: mock(async () => ({ success: true })),
    bulkSync: mock(async () => [])
  }
}))

mock.module('../../src/auth.js', () => ({
  requireRegisteredActor: async (req: any, res: any) => ({ id: 1, role: 'REGISTERED' }),
  getActorFromRequest: async () => ({ id: 1, role: 'REGISTERED' })
}))

import { app } from '../../src/index.js'
import { eventsService } from '../../src/modules/events/events.services.js'

describe('Events API E2E', () => {
  describe('GET /api/events', () => {
    it('should return 200 and call getEvents', async () => {
      const response = await request(app).get('/api/events')
      expect(response.status).toBe(200)
      expect(eventsService.getEvents).toHaveBeenCalled()
    })
  })

  describe('POST /api/events', () => {
    it('should return 201 on valid data', async () => {
      const response = await request(app).post('/api/events').send({
        title: 'Meeting',
        date: '2024-05-20'
      })
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('event')
      expect(response.body.event).toHaveProperty('id', 888)
      expect(response.body).toHaveProperty('occurrences')
    })

    it('should return 400 when title is missing', async () => {
      const response = await request(app).post('/api/events').send({
        date: '2024-05-20'
      })
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return 400 when date is missing', async () => {
      const response = await request(app).post('/api/events').send({
        title: 'Meeting'
      })
      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /api/events/:id', () => {
    it('should return 200 on valid update', async () => {
      const response = await request(app).patch('/api/events/888').send({
        title: 'Updated Meeting'
      })
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('title', 'Updated Meeting')
    })

    it('should return 400 on invalid event ID', async () => {
      const response = await request(app).patch('/api/events/abc').send({
        title: 'Updated'
      })
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/events/:id', () => {
    it('should return 200 on valid delete', async () => {
      const response = await request(app).delete('/api/events/888')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })

    it('should return 400 on invalid event ID', async () => {
      const response = await request(app).delete('/api/events/abc')
      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/events (bulk sync)', () => {
    it('should return 200 on valid bulk sync', async () => {
      const response = await request(app).put('/api/events').send({
        events: [
          { id: 1, title: 'Event 1', date: '2024-05-20' },
          { id: 2, title: 'Event 2', date: '2024-05-21' }
        ]
      })
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })
  })
})
