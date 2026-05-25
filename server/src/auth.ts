import express from 'express'
import { getAuth, clerkClient } from '@clerk/express'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from './db/client'
import {
  type UserRole,
  lessons,
  fileRecords,
  studyPlanCollaborators,
  studyPlans,
  subjects,
  users,
} from './db/schema'
import { AuthActor } from './types'
import { asBigInt } from './utils'

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

    if (existingUser && existingUser.deletedAt === null) {
      // Synchronizujeme jmĂ©no z Clerku do DB pĹ™i kaĹľdĂ©m pĹ™ihlĂˇĹˇenĂ­
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId)
        const clerkFullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
        if (clerkFullName && clerkFullName !== existingUser.fullName) {
          const [synced] = await db
            .update(users)
            .set({ fullName: clerkFullName })
            .where(eq(users.id, existingUser.id))
            .returning({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, deletedAt: users.deletedAt })
          return toAuthActor(synced)
        }
      } catch {
        // Ignorujeme chybu synchronizace â€” pouĹľijeme data z DB
      }
      return toAuthActor(existingUser)
    }

    let user = existingUser ?? null

    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId)
        const email = clerkUser.emailAddresses[0]?.emailAddress || ''
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'UĹľivatel'

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
              fullName: fullName !== 'UĹľivatel' ? fullName : user.fullName,
            })
            .where(eq(users.id, user.id))
            .returning({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, deletedAt: users.deletedAt })
          user = updatedUser ?? null
        } else {
          try {
            const [createdUser] = await db
              .insert(users)
              .values({ clerkId: auth.userId, email, fullName, role: 'REGISTERED' })
              .onConflictDoNothing({ target: users.clerkId })
              .returning({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, deletedAt: users.deletedAt })
            user = createdUser ?? null
            
            if (!user) {
              const [fallbackUser] = await db
                .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, deletedAt: users.deletedAt })
                .from(users)
                .where(eq(users.clerkId, auth.userId))
                .limit(1)
              user = fallbackUser ?? null
            }
          } catch (insertErr) {
            console.error('Konflikt pĹ™i vklĂˇdĂˇnĂ­:', insertErr)
            const [fallbackUser] = await db
              .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, deletedAt: users.deletedAt })
              .from(users)
              .where(eq(users.clerkId, auth.userId))
              .limit(1)
            user = fallbackUser ?? null
          }
        }

        if (user) return toAuthActor(user)
      } catch (err) {
        console.error(`Chyba pĹ™i vytvĂˇĹ™enĂ­ uĹľivatele z Clerku:`, err)
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

