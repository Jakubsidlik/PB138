import { describe, expect, it, mock } from 'bun:test'
import request from 'supertest'

mock.module('../../../server/src/modules/groups/groups.services.js', () => ({
  groupsService: {
    getGroups: mock(async () => [
      { id: 1, name: 'Test Group', ownerId: 1, membersCount: 2, unratedCount: 3, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    ]),
    getGroupDetail: mock(async () => ({
      id: 1, name: 'Test Group', ownerId: 1, membersCount: 2, unratedCount: 3,
      createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
    })),
    createGroup: mock(async (_actor: any, data: any) => ({
      id: 2, name: data.name, ownerId: 1, membersCount: 1, unratedCount: 0,
      createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
    })),
    updateGroup: mock(async (_groupId: any, _actor: any, data: any) => ({
      id: 1, name: data.name ?? 'Updated Group', ownerId: 1,
      createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z',
    })),
    deleteGroup: mock(async () => ({ success: true })),
    getMembers: mock(async () => [
      {
        id: 10, groupId: 1, userId: 1, role: 'OWNER',
        user: { id: 1, fullName: 'Owner User', email: 'owner@example.com' },
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 11, groupId: 1, userId: 2, role: 'MEMBER',
        user: { id: 2, fullName: 'Member User', email: 'member@example.com' },
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ]),
    inviteMember: mock(async (_groupId: any, _actor: any, data: any) => ({
      id: 12, groupId: 1, userId: 3, role: 'MEMBER',
      user: { id: 3, fullName: 'Invited User', email: data.email },
    })),
    removeMember: mock(async () => ({ success: true })),
  },
}))

mock.module('../../../server/src/auth.js', () => ({
  requireRegisteredActor: async (_req: any, _res: any) => ({ id: 1, role: 'REGISTERED' }),
  requireAdmin: async (_req: any, _res: any) => ({ id: 1, role: 'ADMIN' }),
  getActorFromRequest: async () => ({ id: 1, role: 'REGISTERED' }),
}))

import { app } from '../../../server/src/index'
import { groupsService } from '../../../server/src/modules/groups/groups.services'

describe('Groups API E2E', () => {
  describe('GET /api/groups', () => {
    it('should return 200 and list of groups', async () => {
      const response = await request(app).get('/api/groups')
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body[0]).toHaveProperty('name', 'Test Group')
      expect(response.body[0]).toHaveProperty('membersCount')
      expect(groupsService.getGroups).toHaveBeenCalled()
    })
  })

  describe('POST /api/groups', () => {
    it('should return 201 on valid data', async () => {
      const response = await request(app).post('/api/groups').send({ name: 'New Group' })
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('name', 'New Group')
      expect(response.body).toHaveProperty('id')
    })

    it('should return 400 when name is missing', async () => {
      const response = await request(app).post('/api/groups').send({})
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return 400 when name is empty string', async () => {
      const response = await request(app).post('/api/groups').send({ name: '   ' })
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/groups/:id', () => {
    it('should return 200 with group detail', async () => {
      const response = await request(app).get('/api/groups/1')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', 1)
      expect(response.body).toHaveProperty('membersCount')
    })

    it('should return 400 on invalid ID', async () => {
      const response = await request(app).get('/api/groups/abc')
      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /api/groups/:id', () => {
    it('should return 200 on valid update', async () => {
      const response = await request(app).patch('/api/groups/1').send({ name: 'Updated Group' })
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('name', 'Updated Group')
    })

    it('should return 400 on invalid ID', async () => {
      const response = await request(app).patch('/api/groups/abc').send({ name: 'Updated' })
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/groups/:id', () => {
    it('should return 200 on valid delete', async () => {
      const response = await request(app).delete('/api/groups/1')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })

    it('should return 400 on invalid ID', async () => {
      const response = await request(app).delete('/api/groups/abc')
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/groups/:id/members', () => {
    it('should return 200 with list of members', async () => {
      const response = await request(app).get('/api/groups/1/members')
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBe(2)
      expect(response.body[0]).toHaveProperty('role', 'OWNER')
      expect(response.body[1]).toHaveProperty('role', 'MEMBER')
    })

    it('should return 400 on invalid group ID', async () => {
      const response = await request(app).get('/api/groups/abc/members')
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/groups/:id/invite', () => {
    it('should return 201 on valid invitation', async () => {
      const response = await request(app)
        .post('/api/groups/1/invite')
        .send({ email: 'newuser@example.com' })
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('role', 'MEMBER')
      expect(response.body).toHaveProperty('user')
    })

    it('should return 400 when email is missing', async () => {
      const response = await request(app).post('/api/groups/1/invite').send({})
      expect(response.status).toBe(400)
    })

    it('should return 400 when email is invalid', async () => {
      const response = await request(app).post('/api/groups/1/invite').send({ email: 'not-an-email' })
      expect(response.status).toBe(400)
    })

    it('should return 400 on invalid group ID', async () => {
      const response = await request(app)
        .post('/api/groups/abc/invite')
        .send({ email: 'valid@example.com' })
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/groups/:id/members/:userId', () => {
    it('should return 200 on valid remove', async () => {
      const response = await request(app).delete('/api/groups/1/members/2')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })

    it('should return 400 on invalid group ID', async () => {
      const response = await request(app).delete('/api/groups/abc/members/2')
      expect(response.status).toBe(400)
    })

    it('should return 400 on invalid user ID', async () => {
      const response = await request(app).delete('/api/groups/1/members/xyz')
      expect(response.status).toBe(400)
    })
  })
})
