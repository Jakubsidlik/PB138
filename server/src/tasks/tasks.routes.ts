import express from 'express'
import { tasksService } from './tasks.services.js'
import { bulkTasksSchema, taskSchema, updateTaskSchema } from '../schemas.js'
import { asBigInt, parseCursorPagination, parseOptionalDate } from '../utils.js'
import { requireRegisteredActor } from '../auth.js'
import { asyncHandler, AppError } from '../middleware/error-handler.js'
import { validate } from '../middleware/validate.js'

export const tasksRouter: express.Router = express.Router()

tasksRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const pagination = parseCursorPagination(req, { defaultLimit: 30, maxLimit: 200 })
  
  const filters = {
    pagination,
    subjectId: asBigInt(req.query.subjectId),
    studyPlanId: asBigInt(req.query.studyPlanId),
    includeDeleted: req.query.includeDeleted === 'true',
    done: req.query.done as string | null,
    favorite: req.query.favorite as string | null,
    tag: typeof req.query.tag === 'string' ? req.query.tag.trim() : '',
    search: typeof req.query.search === 'string' ? req.query.search.trim() : '',
    deadlineFrom: parseOptionalDate(req.query.deadlineFrom),
    deadlineTo: parseOptionalDate(req.query.deadlineTo),
  }

  const result = await tasksService.getTasks(actor.id, filters)
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

  const created = await tasksService.createTask(actor.id, req.body)
  res.status(201).json(created)
}))

tasksRouter.patch('/:id', validate(updateTaskSchema), asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const taskId = asBigInt(req.params.id)
  if (!taskId) throw new AppError('Neplatne ID ukolu.', 400)

  const { deadline } = req.body
  if (deadline !== undefined && deadline !== null) {
    const d = new Date(deadline)
    if (Number.isNaN(d.getTime())) {
      throw new AppError('Neplatny format deadline.', 400)
    }
  }

  const updated = await tasksService.updateTask(taskId, actor.id, req.body)
  res.json(updated)
}))

tasksRouter.delete('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const taskId = asBigInt(req.params.id)
  if (!taskId) throw new AppError('Neplatne ID ukolu.', 400)

  const result = await tasksService.deleteTask(taskId, actor.id)
  res.json(result)
}))

tasksRouter.put('/', validate(bulkTasksSchema), asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const result = await tasksService.bulkSync(actor.id, req.body.tasks)
  res.json({ success: true, tasks: result })
}))
