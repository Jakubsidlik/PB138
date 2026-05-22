import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

/**
 * Creates an Express middleware that validates the request body against a Zod schema.
 * Returns 400 with the first validation error message on failure.
 *
 * Usage: router.post('/', validate(taskSchema), asyncHandler(async (req, res) => { ... }))
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: result.error.errors[0].message })
      return
    }
    req.body = result.data
    next()
  }
}
