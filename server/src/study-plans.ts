import express from 'express'
import { CollaborationRole, Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { studyPlanSchema, updateStudyPlanSchema, shareStudyPlanSchema } from './schemas.js'
import { asBigInt, parseOptionalDate, toDateOnlyIso } from './utils.js'
import { getActorFromRequest, isPublicActor, requireRegisteredActor } from './auth.js'

export const studyPlansRouter = express.Router()

studyPlansRouter.get('/', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const includeInactive = req.query.includeInactive === 'true'

    const where: Prisma.StudyPlanWhereInput = isPublicActor(actor)
      ? {
          isShared: true,
          isActive: includeInactive ? undefined : true,
        }
      : {
          isActive: includeInactive ? undefined : true,
          OR: [
            { userId: BigInt(actor.id) },
            { isShared: true },
            { collaborators: { some: { userId: BigInt(actor.id) } } },
          ],
        }

    const studyPlans = await prisma.studyPlan.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { startDate: 'asc' }],
      include: {
        _count: {
          select: {
            subjects: true,
            tasks: true,
            lessons: true,
          },
        },
      },
    })

    const collaboratorRoleByPlanId = new Map<string, CollaborationRole>()
    if (!isPublicActor(actor) && studyPlans.length > 0) {
      const collaborators = await prisma.studyPlanCollaborator.findMany({
        where: {
          userId: BigInt(actor.id),
          studyPlanId: { in: studyPlans.map((plan) => plan.id) },
        },
        select: {
          studyPlanId: true,
          role: true,
        },
      })

      for (const collaborator of collaborators) {
        collaboratorRoleByPlanId.set(collaborator.studyPlanId.toString(), collaborator.role)
      }
    }

    res.json(
      studyPlans.map((plan) => ({
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
        canEditMetadata:
          !isPublicActor(actor) && (actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)),
        canCreateSubjects:
          !isPublicActor(actor) &&
          (actor.role === 'ADMIN' ||
            plan.userId === BigInt(actor.id) ||
            collaboratorRoleByPlanId.get(plan.id.toString()) === 'CONTRIBUTOR'),
        subjectsCount: plan._count.subjects,
        tasksCount: plan._count.tasks,
        lessonsCount: plan._count.lessons,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    next(error)
  }
})

studyPlansRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

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

    const created = await prisma.studyPlan.create({
      data: {
        userId: BigInt(actor.id),
        name: payload.name,
        description: payload.description ?? null,
        faculty: payload.faculty ?? null,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        isActive: payload.isActive,
        isShared: payload.isShared,
      },
    })

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
    if (!actor) {
      return
    }

    const studyPlanId = asBigInt(req.params.id)

    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const existing = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } })
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

    const updated = await prisma.studyPlan.update({
      where: { id: studyPlanId },
      data: {
        name: payload.name,
        description: payload.description,
        faculty: payload.faculty,
        startDate: parsedStartDate ?? undefined,
        endDate: parsedEndDate,
        isActive: payload.isActive,
        isShared: payload.isShared,
      },
    })

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
    if (!actor) {
      return
    }

    const studyPlanId = asBigInt(req.params.id)

    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const existing = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } })
    if (!existing) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canDelete = actor.role === 'ADMIN' || existing.userId === BigInt(actor.id)
    if (!canDelete) {
      res.status(403).json({ error: 'Nemate opravneni smazat tento plan.' })
      return
    }

    await prisma.studyPlan.delete({ where: { id: studyPlanId } })

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

studyPlansRouter.get('/:id/collaborators', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const studyPlanId = asBigInt(req.params.id)
    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const plan = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } })
    if (!plan) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canRead =
      actor.role === 'ADMIN' ||
      plan.userId === BigInt(actor.id) ||
      (await prisma.studyPlanCollaborator.findFirst({
        where: { studyPlanId, userId: BigInt(actor.id) },
      })) !== null

    if (!canRead) {
      res.status(403).json({ error: 'Nemate opravneni zobrazit spolupracovniky.' })
      return
    }

    const collaborators = await prisma.studyPlanCollaborator.findMany({
      where: { studyPlanId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json(
      collaborators.map((collaborator) => ({
        id: Number(collaborator.id),
        studyPlanId: Number(collaborator.studyPlanId),
        userId: Number(collaborator.userId),
        role: collaborator.role,
        user: {
          id: Number(collaborator.user.id),
          fullName: collaborator.user.fullName,
          email: collaborator.user.email,
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
    if (!actor) {
      return
    }

    const studyPlanId = asBigInt(req.params.id)
    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const plan = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } })
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

    const user = await prisma.user.findFirst({ where: { email: payload.email.toLowerCase(), deletedAt: null } })
    if (!user) {
      res.status(404).json({ error: 'Uzivatel s danym emailem nebyl nalezen.' })
      return
    }

    if (user.id === plan.userId) {
      res.status(400).json({ error: 'Vlastnika planu nelze pridat jako spolupracovnika.' })
      return
    }

    const role = payload.role
    const collaborator = await prisma.studyPlanCollaborator.upsert({
      where: {
        studyPlanId_userId: {
          studyPlanId,
          userId: user.id,
        },
      },
      update: {
        role,
      },
      create: {
        studyPlanId,
        userId: user.id,
        role,
      },
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
    if (!actor) {
      return
    }

    const studyPlanId = asBigInt(req.params.id)
    const userId = asBigInt(req.params.userId)
    if (!studyPlanId || !userId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu nebo uzivatele.' })
      return
    }

    const plan = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } })
    if (!plan) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canShare = actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)
    if (!canShare) {
      res.status(403).json({ error: 'Nemate opravneni upravovat sdileni tohoto planu.' })
      return
    }

    await prisma.studyPlanCollaborator.deleteMany({
      where: {
        studyPlanId,
        userId,
      },
    })

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})