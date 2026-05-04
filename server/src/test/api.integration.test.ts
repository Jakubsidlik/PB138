import { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../prisma.js'

describe('api integration', () => {
  let app: { listen: (port: number) => Server }
  let server: Server
  let baseUrl = ''
  let testUserId = ''
  const testEmail = `integration-${Date.now()}@example.com`

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.VITEST = 'true'

    const appModule = await import('../index.js')
    app = appModule.app

    server = app.listen(0)

    await new Promise<void>((resolve) => {
      server.once('listening', () => resolve())
    })

    const address = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${address.port}`

    const user = await prisma.user.create({
      data: {
        fullName: 'Integration User',
        email: testEmail,
        role: 'REGISTERED',
        passwordHash: 'Integration1!',
      },
    })

    testUserId = String(user.id)
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } })

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  })

  it('creates upload URL via real API call', async () => {
    const response = await fetch(`${baseUrl}/api/files/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
      },
      body: JSON.stringify({
        filename: 'integration test file.pdf',
        contentType: 'application/pdf',
      }),
    })

    expect(response.status).toBe(200)

    const payload = (await response.json()) as {
      uploadUrl?: string
      fileKey?: string
      fileUrl?: string
    }

    expect(typeof payload.uploadUrl).toBe('string')
    expect(typeof payload.fileKey).toBe('string')
    expect(typeof payload.fileUrl).toBe('string')
    expect(payload.fileKey).toContain('-integration_test_file.pdf')
  })

  it('returns publicly readable files via real API call', async () => {
    const response = await fetch(`${baseUrl}/api/files/public`)
    expect(response.status).toBe(200)

    const payload = (await response.json()) as Array<{ isShared?: boolean }>
    expect(Array.isArray(payload)).toBe(true)

    for (const file of payload) {
      expect(file.isShared).toBe(true)
    }
  })
})
