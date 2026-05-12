import { lessonsRepository } from './lessons.repository.js'
import { AppError } from '../middleware/error-handler.js'
import { asNumberId } from '../utils.js'
import { lessonNotes, fileRecords } from '../db/schema.js'

export class LessonsService {
  async getLessons(actor: { id: number, role: string }, filters: {
    subjectId?: bigint | null
    studyPlanId?: bigint | null
    includeDeleted?: boolean
  }) {
    const rows = await lessonsRepository.findAll(actor, filters)
    
    const mappedLessons = await Promise.all(rows.map(async (row) => ({
      id: Number(row.id),
      subjectId: asNumberId(row.subjectId),
      studyPlanId: asNumberId(row.studyPlanId),
      title: row.title,
      content: row.content,
      isShared: row.isShared,
      orderIndex: row.orderIndex,
      notesCount: await lessonsRepository.countByLesson(lessonNotes, row.id),
      filesCount: await lessonsRepository.countByLesson(fileRecords, row.id),
      deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })))

    return mappedLessons
  }

  async createLesson(actorId: number, data: any) {
    const created = await lessonsRepository.create({
      subjectId: data.subjectId ? BigInt(data.subjectId) : null,
      studyPlanId: data.studyPlanId ? BigInt(data.studyPlanId) : null,
      title: data.title,
      content: data.content ?? null,
      isShared: data.isShared,
      orderIndex: Math.trunc(data.orderIndex),
    })

    return {
      id: Number(created.id),
      subjectId: asNumberId(created.subjectId),
      studyPlanId: asNumberId(created.studyPlanId),
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
      studyPlanId: data.studyPlanId !== undefined ? (data.studyPlanId ? BigInt(data.studyPlanId) : null) : undefined,
      title: data.title,
      content: data.content,
      isShared: data.isShared,
      orderIndex: data.orderIndex !== undefined ? Math.trunc(data.orderIndex) : undefined,
    })

    return {
      id: Number(updated.id),
      subjectId: asNumberId(updated.subjectId),
      studyPlanId: asNumberId(updated.studyPlanId),
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

  async getNotes(lessonId: bigint, actor: { id: number, role: string }, filters: { includeAll?: boolean }) {
    const lesson = await lessonsRepository.findById(lessonId)
    if (!lesson || lesson.deletedAt) {
      throw new AppError('Lekce nebyla nalezena.', 404)
    }

    const isPublic = actor.role === 'PUBLIC'
    if (isPublic && !lesson.isShared) {
      throw new AppError('Verejnost vidi jen verejne poznamky.', 403)
    }

    const notes = await lessonsRepository.findNotes(lessonId, {
      includeAll: filters.includeAll,
      userId: BigInt(actor.id),
      isPublic,
    })

    return notes.map((note) => ({
      id: Number(note.id),
      lessonId: Number(note.lessonId),
      userId: Number(note.userId),
      note: note.note,
      isPinned: note.isPinned,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }))
  }

  async createNote(lessonId: bigint, actorId: number, data: { note: string, isPinned?: boolean }) {
    const lesson = await lessonsRepository.findById(lessonId)
    if (!lesson || lesson.deletedAt) {
      throw new AppError('Lekce nebyla nalezena.', 404)
    }

    const created = await lessonsRepository.createNote({
      lessonId,
      userId: BigInt(actorId),
      note: data.note,
      isPinned: data.isPinned,
    })

    return {
      id: Number(created.id),
      lessonId: Number(created.lessonId),
      userId: Number(created.userId),
      note: created.note,
      isPinned: created.isPinned,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }
  }

  async updateNote(noteId: bigint, actorId: number, actorRole: string, data: { note?: string, isPinned?: boolean }) {
    const existing = await lessonsRepository.findNoteById(noteId)
    if (!existing) {
      throw new AppError('Poznamka nebyla nalezena.', 404)
    }

    if (existing.userId !== BigInt(actorId) && actorRole !== 'ADMIN') {
      throw new AppError('Nemate opravneni upravit tuto poznamku.', 403)
    }

    const updated = await lessonsRepository.updateNote(noteId, data)
    return {
      id: Number(updated.id),
      lessonId: Number(updated.lessonId),
      userId: Number(updated.userId),
      note: updated.note,
      isPinned: updated.isPinned,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  async deleteNote(noteId: bigint, actorId: number, actorRole: string) {
    const existing = await lessonsRepository.findNoteById(noteId)
    if (!existing) {
      throw new AppError('Poznamka nebyla nalezena.', 404)
    }

    if (existing.userId !== BigInt(actorId) && actorRole !== 'ADMIN') {
      throw new AppError('Nemate opravneni smazat tuto poznamku.', 403)
    }

    return lessonsRepository.deleteNote(noteId)
  }

  async getAnnotations(targetType: string, targetId: bigint) {
    const annotations = await lessonsRepository.findAnnotations(targetType, targetId)
    return annotations.map((annotation) => ({
      id: Number(annotation.id),
      targetType: annotation.targetType,
      targetId: Number(annotation.targetId),
      userId: Number(annotation.userId),
      startOffset: annotation.startOffset,
      endOffset: annotation.endOffset,
      selectedText: annotation.selectedText,
      comment: annotation.comment,
      createdAt: annotation.createdAt.toISOString(),
      updatedAt: annotation.updatedAt.toISOString(),
    }))
  }

  async createAnnotation(actorId: number, data: any) {
    const created = await lessonsRepository.createAnnotation({
      targetType: data.targetType,
      targetId: BigInt(data.targetId),
      userId: BigInt(actorId),
      startOffset: Math.trunc(data.startOffset),
      endOffset: Math.trunc(data.endOffset),
      selectedText: data.selectedText.trim(),
      comment: data.comment.trim(),
    })

    return {
      id: Number(created.id),
      targetType: created.targetType,
      targetId: Number(created.targetId),
      userId: Number(created.userId),
      startOffset: created.startOffset,
      endOffset: created.endOffset,
      selectedText: created.selectedText,
      comment: created.comment,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }
  }

  async deleteAnnotation(annotationId: bigint, actorId: number, actorRole: string) {
    const existing = await lessonsRepository.findAnnotationById(annotationId)
    if (!existing) {
      throw new AppError('Anotace nebyla nalezena.', 404)
    }

    if (existing.userId !== BigInt(actorId) && actorRole !== 'ADMIN') {
      throw new AppError('Nemate opravneni smazat tuto anotaci.', 403)
    }

    return lessonsRepository.deleteAnnotation(annotationId)
  }
}

export const lessonsService = new LessonsService()
