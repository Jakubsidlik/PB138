import { describe, expect, it } from 'bun:test'
import request from 'supertest'
import { app } from '../../../server/src/index'

describe('E2E API Tests (General)', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK and database status', async () => {
      const response = await request(app).get('/api/health')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'OK')
      expect(response.body).toHaveProperty('database')
    })
  })

  describe('Not Found (404)', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app).get('/api/this-does-not-exist')
      expect(response.status).toBe(404)
    })
  })

  describe('HTTP Method Not Allowed', () => {
    it('OPTIONS /api/health should return 204 (CORS preflight)', async () => {
      const response = await request(app).options('/api/health')
      expect(response.status).toBe(204)
    })
  })

  describe('Content-Type Handling', () => {
    it('should accept application/json', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Content-Type', 'application/json')
      expect(response.status).toBe(200)
    })
  })

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const response = await request(app).get('/api/health')
      expect(response.headers).toHaveProperty('access-control-allow-origin')
    })
  })
})
