import express from 'express'
import { getAuth, clerkClient } from '@clerk/express'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from './db/client.js'
import {
  type AnnotationTargetType,
  type UserRole,
  fileComments,
  lessonNotes,
  lessons,
  fileRecords,
  studyPlanCollaborators,
  studyPlans,
  subjects,
  users,
} from './db/schema.js'
import { AuthActor } from './types.js'
import { asBigInt } from './utils.js'

export const toAuthActor = (user: { id: bigint; fullName: string; email: string; role: UserRole }): AuthActor => ({
  id: Number(user.id),
  fullName: user.fullName,
  email: user.email,
  role: user.role,
})

export const getActorFromRequest = async (req: express.Request): Promise<AuthActor> => {
  const auth = getAuth(req)
  const requestedUserId = asBigInt(req.header('x-user-id'))

  if (requestedUserId && !auth.userId) {
    const [requestedUser] = await db
      .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role })
      .from(users)
      .where(and(eq(users.id, requestedUserId), isNull(users.deletedAt)))
      .limit(1)
    if (requestedUser) return toAuthActor(requestedUser)
  }

  if (auth.userId) {
    const [existingUser] = await db
      .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, deletedAt: users.deletedAt })
      .from(users)
      .where(eq(users.clerkId, auth.userId))
      .limit(1)

    if (existingUser && existingUser.deletedAt === null) return toAuthActor(existingUser)

    let user = existingUser ?? null

    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId)
        const email = clerkUser.emailAddresses[0]?.emailAddress || ''
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Uživatel'

        if (email) {
          const [foundUser] = await db
            .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, deletedAt: users.deletedAt })
            .from(users)
            .where(eq(users.email, email))
            .limit(1)
          user = foundUser ?? null
        }

        if (user) {
          const [updatedUser] = await db
            .update(users)
            .set({
              clerkId: auth.userId,
              deletedAt: null,
              fullName: fullName !== 'Uživatel' ? fullName : user.fullName,
            })
            .where(eq(users.id, user.id))
            .returning({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, deletedAt: users.deletedAt })
          user = updatedUser ?? null
        } else {
          const [createdUser] = await db
            .insert(users)
            .values({ clerkId: auth.userId, email, fullName, role: 'REGISTERED' })
            .returning({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, deletedAt: users.deletedAt })
          user = createdUser ?? null
        }

        if (user) return toAuthActor(user)
      } catch (err) {
        console.error(`Chyba při vytváření uživatele z Clerku:`, err)
      }
    }
  }

  return { id: 0, fullName: 'Verejnost', email: '', role: 'PUBLIC' }
}

export const isPublicActor = (actor: AuthActor) => actor.role === 'PUBLIC'

export const requireRegisteredActor = async (req: express.Request, res: express.Response) => {
  const actor = await getActorFromRequest(req)
  if (isPublicActor(actor)) {
    res.status(401).json({ error: 'Tato akce vyzaduje prihlaseni.' })
    return null
  }
  return actor
}

export const requireAdmin = async (req: express.Request, res: express.Response) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return null
  if (actor.role !== 'ADMIN') {
    res.status(403).json({ error: 'Tato akce vyzaduje roli admin.' })
    return null
  }
  return actor
}

export const canActorReadLessonTarget = async (lessonId: bigint, actor: AuthActor): Promise<boolean> => {
  const [lesson] = await db
    .select({
      id: lessons.id,
      deletedAt: lessons.deletedAt,
      isShared: lessons.isShared,
      subjectUserId: subjects.userId,
      studyPlanId: studyPlans.id,
      studyPlanUserId: studyPlans.userId,
    })
    .from(lessons)
    .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
    .leftJoin(studyPlans, eq(lessons.studyPlanId, studyPlans.id))
    .where(eq(lessons.id, lessonId))
    .limit(1)
  if (!lesson || lesson.deletedAt) return false
  if (lesson.isShared) return true
  if (isPublicActor(actor)) return false
  if (actor.role === 'ADMIN') return true
  if (lesson.subjectUserId === BigInt(actor.id) || lesson.studyPlanUserId === BigInt(actor.id)) return true
  if (!lesson.studyPlanId) return false

  const collaborator = await db
    .select({ id: studyPlanCollaborators.id })
    .from(studyPlanCollaborators)
    .where(and(eq(studyPlanCollaborators.studyPlanId, lesson.studyPlanId), eq(studyPlanCollaborators.userId, BigInt(actor.id))))
    .limit(1)
  return collaborator.length > 0
}

export const canActorReadAnnotationTarget = async (targetType: AnnotationTargetType, targetId: bigint, actor: AuthActor): Promise<boolean> => {
  if (targetType === 'LESSON') return canActorReadLessonTarget(targetId, actor)
  if (targetType === 'LESSON_NOTE') {
    const [note] = await db
      .select({ lessonId: lessonNotes.lessonId })
      .from(lessonNotes)
      .where(eq(lessonNotes.id, targetId))
      .limit(1)
    if (!note) return false
    return canActorReadLessonTarget(note.lessonId, actor)
  }
  const [fileComment] = await db
    .select({
      fileDeletedAt: fileRecords.deletedAt,
      fileIsShared: fileRecords.isShared,
      fileUserId: fileRecords.userId,
    })
    .from(fileComments)
    .innerJoin(fileRecords, eq(fileComments.fileId, fileRecords.id))
    .where(eq(fileComments.id, targetId))
    .limit(1)
  if (!fileComment) return false
  if (fileComment.fileDeletedAt) return false
  if (fileComment.fileIsShared) return true
  if (isPublicActor(actor)) return false
  return actor.role === 'ADMIN' || fileComment.fileUserId === BigInt(actor.id)
}