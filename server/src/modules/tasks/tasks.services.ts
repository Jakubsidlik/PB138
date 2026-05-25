import { taskRepository } from './tasks.repository'
import { CursorPagination } from '../../types'
import { AppError } from '../../middleware/error-handler'

export class TasksService {
  async getTasks(actorId: number, filters: {
    pagination: CursorPagination
    includeDeleted?: boolean
    done?: string | null
    search?: string
  }) {
    return taskRepository.findAll(actorId, filters)
  }

  async createTask(actorId: number, data: any) {
    return taskRepository.create(actorId, data)
  }

  async updateTask(taskId: bigint, actorId: number, data: any) {
    const existing = await taskRepository.findByIdForUser(taskId, actorId)
    if (!existing) throw new AppError('Ukol nebyl nalezen.', 404)
    return taskRepository.update(taskId, data)
  }

  async deleteTask(taskId: bigint, actorId: number) {
    const result = await taskRepository.softDelete(taskId, actorId)
    if (!result) throw new AppError('Ukol nebyl nalezen.', 404)
    return result
  }

  async bulkSync(actorId: number, tasks: any[]) {
    return taskRepository.bulkSync(actorId, tasks)
  }
}

export const tasksService = new TasksService()
