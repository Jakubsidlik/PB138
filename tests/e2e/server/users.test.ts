import { describe, expect, it, mock } from 'bun:test'
import request from 'supertest'

mock.module('../../../server/src/modules/users/users.services.js', () => ({
  usersService: {
    getAllUsers: mock(async () => [{ id: 1, fullName: 'Admin', email: 'admin@test.com', role: 'ADMIN' }]),
    getProfile: mock(async (_id: any) => ({ id: 1, fullName: 'User', email: 'user@test.com', role: 'REGISTERED' })),
    createProfile: mock(async (data: any) => ({ id: 2, ...data })),
    updateProfile: mock(async (_id: any, _role: any, data: any) => ({ id: 1, ...data })),
    deleteProfile: mock(async () => ({ success: true })),
    adminUpdateUser: mock(async (_userId: any, data: any) => ({ id: 999, ...data })),
    adminDeleteUser: mock(async () => ({ success: true }))
  }
}))

mock.module('../../../server/src/auth.js', () => ({
  requireRegisteredActor: async (req: any, res: any) => ({ id: 1, role: 'REGISTERED' }),
  requireAdmin: async (req: any, res: any) => ({ id: 1, role: 'ADMIN' }),
  getActorFromRequest: async () => ({ id: 1, role: 'REGISTERED' })
}))

import { app } from '../../../server/src/index'
import { usersService } from '../../../server/src/modules/users/users.services'

describe('Users API E2E', () => {
  describe('GET /api/users (admin)', () => {
    it('should return 200 and list of users', async () => {
      const response = await request(app).get('/api/users')
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body[0]).toHaveProperty('fullName', 'Admin')
      expect(usersService.getAllUsers).toHaveBeenCalled()
    })
  })

  describe('GET /api/profile', () => {
    it('should return 200 and user profile', async () => {
      const response = await request(app).get('/api/profile')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('fullName', 'User')
      expect(response.body).toHaveProperty('email', 'user@test.com')
    })
  })

  describe('POST /api/profile (admin creates profile)', () => {
    it('should return 201 on valid profile data', async () => {
      const response = await request(app).post('/api/profile').send({
        fullName: 'New User',
        email: 'new@example.com'
      })
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id', 2)
      expect(response.body).toHaveProperty('fullName', 'New User')
    })

    it('should return 400 when email is invalid', async () => {
      const response = await request(app).post('/api/profile').send({
        fullName: 'Bad Email',
        email: 'not-valid'
      })
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return 400 when fullName is missing', async () => {
      const response = await request(app).post('/api/profile').send({
        email: 'valid@example.com'
      })
      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/profile', () => {
    it('should return 200 on valid update', async () => {
      const response = await request(app).put('/api/profile').send({
        fullName: 'Updated Name'
      })
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('fullName', 'Updated Name')
    })
  })

  describe('DELETE /api/profile', () => {
    it('should return 200 on delete', async () => {
      const response = await request(app).delete('/api/profile')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })
  })

  describe('PUT /api/users/:id (admin update)', () => {
    it('should return 200 on valid admin update', async () => {
      const response = await request(app).put('/api/users/999').send({
        role: 'ADMIN'
      })
      expect(response.status).toBe(200)
    })

    it('should return 400 on invalid user ID', async () => {
      const response = await request(app).put('/api/users/abc').send({
        role: 'ADMIN'
      })
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/users/:id (admin delete)', () => {
    it('should return 200 on valid admin delete', async () => {
      const response = await request(app).delete('/api/users/999')
      expect(response.status).toBe(200)
    })

    it('should return 400 on invalid user ID', async () => {
      const response = await request(app).delete('/api/users/abc')
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/invite', () => {
    it('should return 200 on valid email invitation request', async () => {
      const response = await request(app).post('/api/invite').send({
        email: 'invited-user@example.com',
        itemName: 'Kalkulus 1',
        itemType: 'subject'
      })
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })

    it('should return 400 when email is missing', async () => {
      const response = await request(app).post('/api/invite').send({
        itemName: 'Kalkulus 1',
        itemType: 'subject'
      })
      expect(response.status).toBe(400)
    })
  })
})
