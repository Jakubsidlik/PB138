import { describe, expect, it, mock } from 'bun:test'
import request from 'supertest'

mock.module('../../../server/src/modules/images/images.services.js', () => ({
  imagesService: {
    getImages: mock(async () => [
      {
        id: 1, groupId: 1, name: 'Car.jpg', fileKey: 'key-1', fileUrl: 'https://example.com/car.jpg',
        size: 2048, tier: 'A', uploadedBy: { id: 1, fullName: 'User One' }, ratedBy: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ]),
    getUnrated: mock(async () => [
      {
        id: 2, groupId: 1, name: 'Truck.jpg', fileKey: 'key-2', fileUrl: 'https://example.com/truck.jpg',
        size: 1024, tier: null, uploadedBy: { id: 1, fullName: 'User One' }, ratedBy: null,
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ]),
    getTierCounts: mock(async () => ({
      S: 0, A: 1, B: 0, C: 0, D: 0, E: 0, F: 0, unrated: 1,
    })),
    getUploadUrl: mock(async () => ({
      uploadUrl: 'https://s3.example.com/presigned-upload',
      fileKey: 'uuid-car.jpg',
      fileUrl: 'https://s3.example.com/uuid-car.jpg',
    })),
    createImage: mock(async (_groupId: any, actor: any, data: any) => ({
      id: 3, groupId: 1, name: data.name, fileKey: data.fileKey ?? null,
      fileUrl: data.fileUrl ?? null, size: data.size ?? 0, tier: null,
      uploadedBy: { id: actor.id, fullName: 'User One' }, ratedBy: null,
      createdAt: '2024-01-03T00:00:00.000Z',
    })),
    setTier: mock(async (_groupId: any, _imageId: any, actor: any, tier: any) => ({
      id: 1, groupId: 1, name: 'Car.jpg', tier, ratedBy: { id: actor.id },
      updatedAt: '2024-01-04T00:00:00.000Z',
    })),
    deleteImage: mock(async () => ({ success: true })),
  },
}))

mock.module('../../../server/src/auth.js', () => ({
  requireRegisteredActor: async (_req: any, _res: any) => ({ id: 1, role: 'REGISTERED' }),
  requireAdmin: async (_req: any, _res: any) => ({ id: 1, role: 'ADMIN' }),
  getActorFromRequest: async () => ({ id: 1, role: 'REGISTERED' }),
}))

import { app } from '../../../server/src/index'
import { imagesService } from '../../../server/src/modules/images/images.services'

describe('Images API E2E', () => {
  describe('GET /api/groups/:id/images', () => {
    it('should return 200 and list of images', async () => {
      const response = await request(app).get('/api/groups/1/images')
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body[0]).toHaveProperty('name', 'Car.jpg')
      expect(response.body[0]).toHaveProperty('tier', 'A')
      expect(imagesService.getImages).toHaveBeenCalled()
    })

    it('should return 400 on invalid group ID', async () => {
      const response = await request(app).get('/api/groups/abc/images')
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/groups/:id/images/unrated', () => {
    it('should return 200 and list of unrated images', async () => {
      const response = await request(app).get('/api/groups/1/images/unrated')
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body[0]).toHaveProperty('tier', null)
      expect(response.body[0]).toHaveProperty('name', 'Truck.jpg')
    })

    it('should return 400 on invalid group ID', async () => {
      const response = await request(app).get('/api/groups/xyz/images/unrated')
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/groups/:id/images/counts', () => {
    it('should return 200 and tier counts', async () => {
      const response = await request(app).get('/api/groups/1/images/counts')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('A', 1)
      expect(response.body).toHaveProperty('unrated', 1)
    })

    it('should return 400 on invalid group ID', async () => {
      const response = await request(app).get('/api/groups/abc/images/counts')
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/groups/:id/images/upload-url', () => {
    it('should return 200 with presigned upload URL', async () => {
      const response = await request(app)
        .post('/api/groups/1/images/upload-url')
        .send({ filename: 'car.jpg', contentType: 'image/jpeg' })
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('uploadUrl')
      expect(response.body).toHaveProperty('fileKey')
      expect(response.body).toHaveProperty('fileUrl')
    })

    it('should return 400 when filename is missing', async () => {
      const response = await request(app)
        .post('/api/groups/1/images/upload-url')
        .send({ contentType: 'image/jpeg' })
      expect(response.status).toBe(400)
    })

    it('should return 400 when contentType is missing', async () => {
      const response = await request(app)
        .post('/api/groups/1/images/upload-url')
        .send({ filename: 'car.jpg' })
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/groups/:id/images', () => {
    it('should return 201 on valid image creation', async () => {
      const response = await request(app)
        .post('/api/groups/1/images')
        .send({ name: 'Ferrari.jpg', size: 4096, fileKey: 'uuid-ferrari.jpg', fileUrl: 'https://example.com/ferrari.jpg' })
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('name', 'Ferrari.jpg')
      expect(response.body).toHaveProperty('id')
    })

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/groups/1/images')
        .send({ size: 1024 })
      expect(response.status).toBe(400)
    })

    it('should return 400 when name is empty', async () => {
      const response = await request(app)
        .post('/api/groups/1/images')
        .send({ name: '   ' })
      expect(response.status).toBe(400)
    })

    it('should return 400 on invalid group ID', async () => {
      const response = await request(app)
        .post('/api/groups/abc/images')
        .send({ name: 'test.jpg' })
      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /api/groups/:id/images/:imageId/tier', () => {
    it('should return 200 on valid tier assignment', async () => {
      const response = await request(app)
        .patch('/api/groups/1/images/1/tier')
        .send({ tier: 'S' })
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('tier', 'S')
    })

    it('should return 400 on invalid tier value', async () => {
      const response = await request(app)
        .patch('/api/groups/1/images/1/tier')
        .send({ tier: 'Z' })
      expect(response.status).toBe(400)
    })

    it('should return 400 when tier is missing', async () => {
      const response = await request(app)
        .patch('/api/groups/1/images/1/tier')
        .send({})
      expect(response.status).toBe(400)
    })

    it('should return 400 on invalid group ID', async () => {
      const response = await request(app)
        .patch('/api/groups/abc/images/1/tier')
        .send({ tier: 'A' })
      expect(response.status).toBe(400)
    })

    it('should return 400 on invalid image ID', async () => {
      const response = await request(app)
        .patch('/api/groups/1/images/xyz/tier')
        .send({ tier: 'A' })
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/groups/:id/images/:imageId', () => {
    it('should return 200 on valid delete', async () => {
      const response = await request(app).delete('/api/groups/1/images/1')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })

    it('should return 400 on invalid group ID', async () => {
      const response = await request(app).delete('/api/groups/abc/images/1')
      expect(response.status).toBe(400)
    })

    it('should return 400 on invalid image ID', async () => {
      const response = await request(app).delete('/api/groups/1/images/xyz')
      expect(response.status).toBe(400)
    })
  })
})
