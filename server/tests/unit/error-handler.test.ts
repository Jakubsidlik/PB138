import { describe, expect, it, mock } from 'bun:test'
import { AppError, errorHandler } from '../../src/middleware/error-handler'

describe('error-handler.ts', () => {
  it('AppError should set message and statusCode correctly', () => {
    const err = new AppError('Custom error', 403)
    expect(err.message).toBe('Custom error')
    expect(err.statusCode).toBe(403)
  })

  it('errorHandler should format AppError correctly', () => {
    const err = new AppError('Not found', 404)
    const req = {} as any
    const res = {
      status: mock((s: number) => res),
      json: mock((d: any) => res)
    } as any
    const next = mock(() => {})

    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' })
  })

  it('errorHandler should format generic Error as 500', () => {
    const err = new Error('Database connection failed')
    const req = {} as any
    const res = {
      status: mock((s: number) => res),
      json: mock((d: any) => res)
    } as any
    const next = mock(() => {})

    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
  })
})
