import { Request, Response, NextFunction } from 'express'

/**
 * Global error handler middleware.
 * Catches all uncaught errors from route handlers and sends a consistent JSON response.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(`[ERROR] ${err.message}`, err.stack)

  const statusCode = (err as any).statusCode || 500
  const message = statusCode === 500 ? 'Internal server error' : err.message

  res.status(statusCode).json({ error: message })
}

/**
 * Creates an error with a custom status code.
 */
export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
  }
}

/**
 * Wraps an async route handler to automatically catch errors and pass them to next().
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}
