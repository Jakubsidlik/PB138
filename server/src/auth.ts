import express from 'express'
import { getAuth, clerkClient } from '@clerk/express'
import { AnnotationTargetType, UserRole } from '@prisma/client'
import { prisma } from './prisma.js'
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
    const requestedUser = await prisma.user.findFirst({ where: { id: requestedUserId, deletedAt: null } })
    if (requestedUser) return toAuthActor(requestedUser)
  }

  if (auth.userId) {
    let user = await prisma.user.findUnique({ where: { clerkId: auth.userId } })
    if (user && user.deletedAt === null) return toAuthActor(user)

    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId)
        const email = clerkUser.emailAddresses[0]?.emailAddress || ''
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Uživatel'

        if (email) user = await prisma.user.findUnique({ where: { email } })

        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { clerkId: auth.userId, deletedAt: null, fullName: fullName !== 'Uživatel' ? fullName : user.fullName }
          })
        } else {
          user = await prisma.user.create({
            data: { clerkId: auth.userId, email, fullName, role: 'REGISTERED' }
          })
        }
        return toAuthActor(user)
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
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, deletedAt: true, isShared: true, subject: { select: { userId: true } }, studyPlan: { select: { id: true, userId: true } } },
  })
  if (!lesson || lesson.deletedAt) return false
  if (lesson.isShared) return true
  if (isPublicActor(actor)) return false
  if (actor.role === 'ADMIN') return true
  if (lesson.subject?.userId === BigInt(actor.id) || lesson.studyPlan?.userId === BigInt(actor.id)) return true
  if (!lesson.studyPlan?.id) return false

  const collaborator = await prisma.studyPlanCollaborator.findFirst({
    where: { studyPlanId: lesson.studyPlan.id, userId: BigInt(actor.id) },
  })
  return collaborator !== null
}

export const canActorReadAnnotationTarget = async (targetType: AnnotationTargetType, targetId: bigint, actor: AuthActor): Promise<boolean> => {
  if (targetType === 'LESSON') return canActorReadLessonTarget(targetId, actor)
  if (targetType === 'LESSON_NOTE') {
    const note = await prisma.lessonNote.findUnique({ where: { id: targetId }, select: { lessonId: true } })
    if (!note) return false
    return canActorReadLessonTarget(note.lessonId, actor)
  }
  const fileComment = await prisma.fileComment.findUnique({
    where: { id: targetId },
    select: { file: { select: { deletedAt: true, isShared: true, userId: true } } },
  })
  if (!fileComment || fileComment.file.deletedAt) return false
  if (fileComment.file.isShared) return true
  if (isPublicActor(actor)) return false
  return actor.role === 'ADMIN' || fileComment.file.userId === BigInt(actor.id)
}