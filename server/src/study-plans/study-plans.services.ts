import { studyPlanRepository } from './study-plans.repository.js'
import { AppError } from '../middleware/error-handler.js'
import { toDateOnlyIso, parseOptionalDate } from '../utils.js'
import { subjects, tasks, lessons } from '../db/schema.js'

export class StudyPlansService {
  async getStudyPlans(actor: { id: number, role: string }, filters: { includeInactive?: boolean }) {
    const plans = await studyPlanRepository.findAll(actor, filters)
    
    const mappedPlans = await Promise.all(plans.map(async (plan) => {
      const collaboratorRole = actor.role !== 'PUBLIC' 
        ? await studyPlanRepository.getCollaboratorRole(plan.id, BigInt(actor.id))
        : null

      return {
        id: Number(plan.id),
        userId: Number(plan.userId),
        name: plan.name,
        description: plan.description,
        faculty: plan.faculty,
        startDate: plan.startDate ? toDateOnlyIso(plan.startDate) : null,
        endDate: plan.endDate ? toDateOnlyIso(plan.endDate) : null,
        isActive: plan.isActive,
        isShared: plan.isShared,
        collaboratorRole,
        canEditMetadata: actor.role !== 'PUBLIC' && (actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)),
        canCreateSubjects:
          actor.role !== 'PUBLIC' &&
          (actor.role === 'ADMIN' ||
            plan.userId === BigInt(actor.id) ||
            collaboratorRole === 'CONTRIBUTOR'),
        subjectsCount: await studyPlanRepository.countByStudyPlan(subjects, plan.id),
        tasksCount: await studyPlanRepository.countByStudyPlan(tasks, plan.id),
        lessonsCount: await studyPlanRepository.countByStudyPlan(lessons, plan.id),
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      }
    }))

    return mappedPlans
  }

  async createStudyPlan(actorId: number, data: any) {
    const parsedStartDate = parseOptionalDate(data.startDate)
    if (data.startDate !== undefined && parsedStartDate === undefined) {
      throw new AppError('Neplatny format startDate.', 400)
    }

    const parsedEndDate = parseOptionalDate(data.endDate)
    if (data.endDate !== undefined && parsedEndDate === undefined) {
      throw new AppError('Neplatny format endDate.', 400)
    }

    const created = await studyPlanRepository.create({
      userId: BigInt(actorId),
      name: data.name,
      description: data.description ?? null,
      faculty: data.faculty ?? null,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      isActive: data.isActive,
      isShared: data.isShared,
    })

    return {
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
    }
  }

  async updateStudyPlan(studyPlanId: bigint, actor: { id: number, role: string }, data: any) {
    const existing = await studyPlanRepository.findById(studyPlanId)
    if (!existing) throw new AppError('Studijni plan nebyl nalezen.', 404)

    const canEditMetadata = actor.role === 'ADMIN' || existing.userId === BigInt(actor.id)
    if (!canEditMetadata) {
      throw new AppError('Nemate opravneni upravovat metadata tohoto planu.', 403)
    }

    const parsedStartDate = parseOptionalDate(data.startDate)
    if (data.startDate !== undefined && (parsedStartDate === undefined || parsedStartDate === null)) {
      throw new AppError('Neplatny format startDate.', 400)
    }

    const parsedEndDate = parseOptionalDate(data.endDate)
    if (data.endDate !== undefined && parsedEndDate === undefined) {
      throw new AppError('Neplatny format endDate.', 400)
    }

    const updated = await studyPlanRepository.update(studyPlanId, {
      name: data.name,
      description: data.description,
      faculty: data.faculty,
      startDate: parsedStartDate ?? undefined,
      endDate: parsedEndDate,
      isActive: data.isActive,
      isShared: data.isShared,
    })

    return {
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
    }
  }

  async deleteStudyPlan(studyPlanId: bigint, actor: { id: number, role: string }) {
    const existing = await studyPlanRepository.findById(studyPlanId)
    if (!existing) throw new AppError('Studijni plan nebyl nalezen.', 404)

    const canDelete = actor.role === 'ADMIN' || existing.userId === BigInt(actor.id)
    if (!canDelete) {
      throw new AppError('Nemate opravneni smazat tento plan.', 403)
    }

    return studyPlanRepository.delete(studyPlanId)
  }

  async getCollaborators(studyPlanId: bigint, actor: { id: number, role: string }) {
    const plan = await studyPlanRepository.findById(studyPlanId)
    if (!plan) throw new AppError('Studijni plan nebyl nalezen.', 404)

    const collaboratorRole = await studyPlanRepository.getCollaboratorRole(studyPlanId, BigInt(actor.id))
    const canRead =
      actor.role === 'ADMIN' ||
      plan.userId === BigInt(actor.id) ||
      collaboratorRole !== null

    if (!canRead) {
      throw new AppError('Nemate opravneni zobrazit spolupracovniky.', 403)
    }

    const collaborators = await studyPlanRepository.findCollaborators(studyPlanId)
    return collaborators.map((collaborator) => ({
      id: Number(collaborator.id),
      studyPlanId: Number(collaborator.studyPlanId),
      userId: Number(collaborator.userId),
      role: collaborator.role,
      user: {
        id: Number(collaborator.userIdRef),
        fullName: collaborator.userFullName,
        email: collaborator.userEmail,
      },
    }))
  }

  async shareStudyPlan(studyPlanId: bigint, actor: { id: number, role: string }, data: { email: string, role: string }) {
    const plan = await studyPlanRepository.findById(studyPlanId)
    if (!plan) throw new AppError('Studijni plan nebyl nalezen.', 404)

    const canShare = actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)
    if (!canShare) {
      throw new AppError('Nemate opravneni sdilet tento plan.', 403)
    }

    const user = await studyPlanRepository.findUserByEmail(data.email)
    if (!user) {
      throw new AppError('Uzivatel s danym emailem nebyl nalezen.', 404)
    }

    if (user.id === plan.userId) {
      throw new AppError('Vlastnika planu nelze pridat jako spolupracovnika.', 400)
    }

    const collaborator = await studyPlanRepository.addCollaborator(studyPlanId, user.id, data.role)
    return {
      id: Number(collaborator.id),
      studyPlanId: Number(collaborator.studyPlanId),
      userId: Number(collaborator.userId),
      role: collaborator.role,
      user: {
        id: Number(user.id),
        fullName: user.fullName,
        email: user.email,
      },
    }
  }

  async unshareStudyPlan(studyPlanId: bigint, userId: bigint, actor: { id: number, role: string }) {
    const plan = await studyPlanRepository.findById(studyPlanId)
    if (!plan) throw new AppError('Studijni plan nebyl nalezen.', 404)

    const canShare = actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)
    if (!canShare) {
      throw new AppError('Nemate opravneni upravovat sdileni tohoto planu.', 403)
    }

    return studyPlanRepository.removeCollaborator(studyPlanId, userId)
  }
}

export const studyPlansService = new StudyPlansService()
