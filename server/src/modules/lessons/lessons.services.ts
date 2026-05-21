import { lessonsRepository } from './lessons.repository.js'
import { AppError } from '../../middleware/error-handler.js'
import { asNumberId } from '../../utils.js'
import { fileRecords } from '../../db/schema.js'

export class LessonsService {
  async getLessons(actor: { id: number, role: string }, filters: {
    subjectId?: bigint | null
    includeDeleted?: boolean
  }) {
    const rows = await lessonsRepository.findAll(actor, filters)
    
    const mappedLessons = rows.map((row) => ({
      id: Number(row.id),
      subjectId: asNumberId(row.subjectId),
      title: row.title,
      content: row.content,
      isShared: row.isShared,
      orderIndex: row.orderIndex,
      notesCount: 0,
      filesCount: 0,
      deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }))

    return mappedLessons
  }

  async createLesson(actorId: number, data: any) {
    const created = await lessonsRepository.create({
      subjectId: data.subjectId ? BigInt(data.subjectId) : null,
      title: data.title,
      content: data.content ?? null,
      isShared: data.isShared,
      orderIndex: Math.trunc(data.orderIndex),
    })

    return {
      id: Number(created.id),
      subjectId: asNumberId(created.subjectId),
      title: created.title,
      content: created.content,
      isShared: created.isShared,
      orderIndex: created.orderIndex,
      deletedAt: created.deletedAt,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }
  }

  async updateLesson(lessonId: bigint, actor: { id: number, role: string }, data: any) {
    const canEdit = await lessonsRepository.canActorManageLesson(actor.id, actor.role, lessonId)
    if (!canEdit) {
      throw new AppError('Nemate opravneni upravit tuto lekci.', 403)
    }

    const updated = await lessonsRepository.update(lessonId, {
      subjectId: data.subjectId !== undefined ? (data.subjectId ? BigInt(data.subjectId) : null) : undefined,
      title: data.title,
      content: data.content,
      isShared: data.isShared,
      orderIndex: data.orderIndex !== undefined ? Math.trunc(data.orderIndex) : undefined,
    })

    return {
      id: Number(updated.id),
      subjectId: asNumberId(updated.subjectId),
      title: updated.title,
      content: updated.content,
      isShared: updated.isShared,
      orderIndex: updated.orderIndex,
      deletedAt: updated.deletedAt,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  async deleteLesson(lessonId: bigint, actor: { id: number, role: string }) {
    const canDelete = await lessonsRepository.canActorManageLesson(actor.id, actor.role, lessonId)
    if (!canDelete) {
      throw new AppError('Nemate opravneni smazat tuto lekci.', 403)
    }

    return lessonsRepository.softDelete(lessonId)
  }

}

export const lessonsService = new LessonsService()
