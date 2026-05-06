import express from 'express'
import { and, asc, eq, exists, inArray, isNull, or, sql } from 'drizzle-orm'

import { db } from './db/client.js'
import { users, studyPlans, studyPlanCollaborators, subjects, tasks, lessons } from './db/schema.js'
import { shareStudyPlanSchema, studyPlanSchema, updateStudyPlanSchema } from './schemas.js'
import { asBigInt, parseOptionalDate, toDateOnlyIso } from './utils.js'
import { getActorFromRequest, isPublicActor, requireRegisteredActor } from './auth.js'

export const studyPlansRouter: express.Router = express.Router()

const studyPlanSelect = {
  id: studyPlans.id,
  userId: studyPlans.userId,
  name: studyPlans.name,
  description: studyPlans.description,
  faculty: studyPlans.faculty,
  startDate: studyPlans.startDate,
  endDate: studyPlans.endDate,
  isActive: studyPlans.isActive,
  isShared: studyPlans.isShared,
  createdAt: studyPlans.createdAt,
  updatedAt: studyPlans.updatedAt,
}

const countByStudyPlan = async (table: any, studyPlanId: bigint) => {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(table).where(eq(table.studyPlanId, studyPlanId))
  return row?.count ?? 0
}

studyPlansRouter.get('/', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const includeInactive = req.query.includeInactive === 'true'

    const visibility = isPublicActor(actor)
      ? eq(studyPlans.isShared, true)
      : or(
          eq(studyPlans.userId, BigInt(actor.id)),
          eq(studyPlans.isShared, true),
          exists(
            db
              .select({ id: studyPlanCollaborators.id })
              .from(studyPlanCollaborators)
              .where(and(eq(studyPlanCollaborators.studyPlanId, studyPlans.id), eq(studyPlanCollaborators.userId, BigInt(actor.id)))),
          ),
        )

    const whereClause = and(
      includeInactive ? undefined : eq(studyPlans.isActive, true),
      visibility,
    )

    const rows = await db.select(studyPlanSelect).from(studyPlans).where(whereClause).orderBy(asc(studyPlans.isActive), asc(studyPlans.startDate))

    const collaboratorRoleByPlanId = new Map<string, string>()
    if (!isPublicActor(actor) && rows.length > 0) {
      const collaborators = await db
        .select({ studyPlanId: studyPlanCollaborators.studyPlanId, role: studyPlanCollaborators.role })
        .from(studyPlanCollaborators)
        .where(and(eq(studyPlanCollaborators.userId, BigInt(actor.id)), inArray(studyPlanCollaborators.studyPlanId, rows.map((plan) => plan.id))))

      for (const collaborator of collaborators) {
        collaboratorRoleByPlanId.set(collaborator.studyPlanId.toString(), collaborator.role)
      }
    }

    const mappedPlans = await Promise.all(rows.map(async (plan) => ({
      id: Number(plan.id),
      userId: Number(plan.userId),
      name: plan.name,
      description: plan.description,
      faculty: plan.faculty,
      startDate: plan.startDate ? toDateOnlyIso(plan.startDate) : null,
      endDate: plan.endDate ? toDateOnlyIso(plan.endDate) : null,
      isActive: plan.isActive,
      isShared: plan.isShared,
      collaboratorRole: collaboratorRoleByPlanId.get(plan.id.toString()) ?? null,
      canEditMetadata: !isPublicActor(actor) && (actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)),
      canCreateSubjects:
        !isPublicActor(actor) &&
        (actor.role === 'ADMIN' ||
          plan.userId === BigInt(actor.id) ||
          collaboratorRoleByPlanId.get(plan.id.toString()) === 'CONTRIBUTOR'),
      subjectsCount: await countByStudyPlan(subjects, plan.id),
      tasksCount: await countByStudyPlan(tasks, plan.id),
      lessonsCount: await countByStudyPlan(lessons, plan.id),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    })))

    res.json(mappedPlans)
  } catch (error) {
    next(error)
  }
})

studyPlansRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const parsed = studyPlanSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const parsedStartDate = parseOptionalDate(payload.startDate)
    if (payload.startDate !== undefined && parsedStartDate === undefined) {
      res.status(400).json({ error: 'Neplatny format startDate.' })
      return
    }

    const parsedEndDate = parseOptionalDate(payload.endDate)
    if (payload.endDate !== undefined && parsedEndDate === undefined) {
      res.status(400).json({ error: 'Neplatny format endDate.' })
      return
    }

    const [created] = await db.insert(studyPlans).values({
      userId: BigInt(actor.id),
      name: payload.name,
      description: payload.description ?? null,
      faculty: payload.faculty ?? null,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      isActive: payload.isActive,
      isShared: payload.isShared,
    }).returning(studyPlanSelect)

    res.status(201).json({
      id: Number(created.id),
      userId: Number(created.userId),
      name: created.name,
      description: created.description,
      faculty: created.faculty,
      startDate: created.startDate ? toDateOnlyIso(created.startDate) : null,
      endDate: created.endDate ? toDateOnlyIso(created.endDate) : null,
      isActive: created.isActive,
      isShared: created.isShared,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

studyPlansRouter.patch('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const studyPlanId = asBigInt(req.params.id)
    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const [existing] = await db.select(studyPlanSelect).from(studyPlans).where(eq(studyPlans.id, studyPlanId)).limit(1)
    if (!existing) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canEditMetadata = actor.role === 'ADMIN' || existing.userId === BigInt(actor.id)
    if (!canEditMetadata) {
      res.status(403).json({ error: 'Nemate opravneni upravovat metadata tohoto planu.' })
      return
    }

    const parsed = updateStudyPlanSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const parsedStartDate = parseOptionalDate(payload.startDate)
    if (payload.startDate !== undefined && (parsedStartDate === undefined || parsedStartDate === null)) {
      res.status(400).json({ error: 'Neplatny format startDate.' })
      return
    }

    const parsedEndDate = parseOptionalDate(payload.endDate)
    if (payload.endDate !== undefined && parsedEndDate === undefined) {
      res.status(400).json({ error: 'Neplatny format endDate.' })
      return
    }

    const [updated] = await db.update(studyPlans).set({
      name: payload.name,
      description: payload.description,
      faculty: payload.faculty,
      startDate: parsedStartDate ?? undefined,
      endDate: parsedEndDate,
      isActive: payload.isActive,
      isShared: payload.isShared,
    }).where(eq(studyPlans.id, studyPlanId)).returning(studyPlanSelect)

    res.json({
      id: Number(updated.id),
      userId: Number(updated.userId),
      name: updated.name,
      description: updated.description,
      faculty: updated.faculty,
      startDate: updated.startDate ? toDateOnlyIso(updated.startDate) : null,
      endDate: updated.endDate ? toDateOnlyIso(updated.endDate) : null,
      isActive: updated.isActive,
      isShared: updated.isShared,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

studyPlansRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const studyPlanId = asBigInt(req.params.id)
    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const [existing] = await db.select({ id: studyPlans.id, userId: studyPlans.userId }).from(studyPlans).where(eq(studyPlans.id, studyPlanId)).limit(1)
    if (!existing) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canDelete = actor.role === 'ADMIN' || existing.userId === BigInt(actor.id)
    if (!canDelete) {
      res.status(403).json({ error: 'Nemate opravneni smazat tento plan.' })
      return
    }

    await db.delete(studyPlans).where(eq(studyPlans.id, studyPlanId))
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

studyPlansRouter.get('/:id/collaborators', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const studyPlanId = asBigInt(req.params.id)
    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const [plan] = await db.select({ id: studyPlans.id, userId: studyPlans.userId }).from(studyPlans).where(eq(studyPlans.id, studyPlanId)).limit(1)
    if (!plan) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canRead =
      actor.role === 'ADMIN' ||
      plan.userId === BigInt(actor.id) ||
      (await db.select({ id: studyPlanCollaborators.id }).from(studyPlanCollaborators).where(and(eq(studyPlanCollaborators.studyPlanId, studyPlanId), eq(studyPlanCollaborators.userId, BigInt(actor.id)))).limit(1)).length > 0

    if (!canRead) {
      res.status(403).json({ error: 'Nemate opravneni zobrazit spolupracovniky.' })
      return
    }

    const collaborators = await db
      .select({
        id: studyPlanCollaborators.id,
        studyPlanId: studyPlanCollaborators.studyPlanId,
        userId: studyPlanCollaborators.userId,
        role: studyPlanCollaborators.role,
        userIdRef: users.id,
        userFullName: users.fullName,
        userEmail: users.email,
      })
      .from(studyPlanCollaborators)
      .innerJoin(users, eq(studyPlanCollaborators.userId, users.id))
      .where(eq(studyPlanCollaborators.studyPlanId, studyPlanId))
      .orderBy(asc(studyPlanCollaborators.createdAt))

    res.json(
      collaborators.map((collaborator) => ({
        id: Number(collaborator.id),
        studyPlanId: Number(collaborator.studyPlanId),
        userId: Number(collaborator.userId),
        role: collaborator.role,
        user: {
          id: Number(collaborator.userIdRef),
          fullName: collaborator.userFullName,
          email: collaborator.userEmail,
        },
      })),
    )
  } catch (error) {
    next(error)
  }
})

studyPlansRouter.post('/:id/share', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const studyPlanId = asBigInt(req.params.id)
    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const [plan] = await db.select({ id: studyPlans.id, userId: studyPlans.userId }).from(studyPlans).where(eq(studyPlans.id, studyPlanId)).limit(1)
    if (!plan) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canShare = actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)
    if (!canShare) {
      res.status(403).json({ error: 'Nemate opravneni sdilet tento plan.' })
      return
    }

    const parsed = shareStudyPlanSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const [user] = await db.select({ id: users.id, fullName: users.fullName, email: users.email }).from(users).where(and(eq(users.email, payload.email.toLowerCase()), isNull(users.deletedAt))).limit(1)
    if (!user) {
      res.status(404).json({ error: 'Uzivatel s danym emailem nebyl nalezen.' })
      return
    }

    if (user.id === plan.userId) {
      res.status(400).json({ error: 'Vlastnika planu nelze pridat jako spolupracovnika.' })
      return
    }

    const [collaborator] = await db
      .insert(studyPlanCollaborators)
      .values({
        studyPlanId,
        userId: user.id,
        role: payload.role,
      })
      .onConflictDoUpdate({
        target: [studyPlanCollaborators.studyPlanId, studyPlanCollaborators.userId],
        set: { role: payload.role },
      })
      .returning({
        id: studyPlanCollaborators.id,
        studyPlanId: studyPlanCollaborators.studyPlanId,
        userId: studyPlanCollaborators.userId,
        role: studyPlanCollaborators.role,
      })

    res.status(201).json({
      id: Number(collaborator.id),
      studyPlanId: Number(collaborator.studyPlanId),
      userId: Number(collaborator.userId),
      role: collaborator.role,
      user: {
        id: Number(user.id),
        fullName: user.fullName,
        email: user.email,
      },
    })
  } catch (error) {
    next(error)
  }
})

studyPlansRouter.delete('/:id/share/:userId', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const studyPlanId = asBigInt(req.params.id)
    const userId = asBigInt(req.params.userId)
    if (!studyPlanId || !userId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu nebo uzivatele.' })
      return
    }

    const [plan] = await db.select({ id: studyPlans.id, userId: studyPlans.userId }).from(studyPlans).where(eq(studyPlans.id, studyPlanId)).limit(1)
    if (!plan) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canShare = actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)
    if (!canShare) {
      res.status(403).json({ error: 'Nemate opravneni upravovat sdileni tohoto planu.' })
      return
    }

    await db.delete(studyPlanCollaborators).where(and(eq(studyPlanCollaborators.studyPlanId, studyPlanId), eq(studyPlanCollaborators.userId, userId)))
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})