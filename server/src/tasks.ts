import express from 'express'
import { taskRepository } from './repositories/task.repository.js'
import { bulkTasksSchema, taskSchema, updateTaskSchema } from './schemas.js'
import { asBigInt } from './utils.js'
import { requireRegisteredActor } from './auth.js'
import { asyncHandler, AppError } from './middleware/error-handler.js'
import { validate } from './middleware/validate.js'

export const tasksRouter: express.Router = express.Router()

tasksRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const result = await taskRepository.findAll(actor.id, req)
  res.json(result)
}))

tasksRouter.post('/', validate(taskSchema), asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const { deadline } = req.body
  if (deadline !== undefined && deadline !== null) {
    const d = new Date(deadline)
    if (Number.isNaN(d.getTime())) {
      throw new AppError('Neplatny format deadline.', 400)
    }
  }

  const created = await taskRepository.create(actor.id, req.body)
  res.status(201).json(created)
}))

tasksRouter.patch('/:id', validate(updateTaskSchema), asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const taskId = asBigInt(req.params.id)
  if (!taskId) throw new AppError('Neplatne ID ukolu.', 400)

  const existing = await taskRepository.findByIdForUser(taskId, actor.id)
  if (!existing) throw new AppError('Ukol nebyl nalezen.', 404)

  const { deadline } = req.body
  if (deadline !== undefined && deadline !== null) {
    const d = new Date(deadline)
    if (Number.isNaN(d.getTime())) {
      throw new AppError('Neplatny format deadline.', 400)
    }
  }

  const updated = await taskRepository.update(taskId, req.body)
  res.json(updated)
}))

tasksRouter.delete('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const taskId = asBigInt(req.params.id)
  if (!taskId) throw new AppError('Neplatne ID ukolu.', 400)

  const result = await taskRepository.softDelete(taskId, actor.id)
  if (!result) throw new AppError('Ukol nebyl nalezen.', 404)

  res.json(result)
}))

tasksRouter.put('/', validate(bulkTasksSchema), asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const finalTasks = await taskRepository.bulkSync(actor.id, req.body.tasks)
  res.json({ success: true, tasks: finalTasks })
}))