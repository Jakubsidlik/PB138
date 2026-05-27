import { studyPlanRepository } from './study-plans.repository'
import { AppError } from '../../middleware/error-handler'

import { subjects, tasks, lessons, users } from '../../db/schema'
import { db } from '../../db/client'
import { Resend } from 'resend'
import { env } from '../../env'

export class StudyPlansService {
  async getStudyPlans(actor: { id: number, role: string }, filters: { includeInactive?: boolean }) {
    const plans = await studyPlanRepository.findAll(actor, filters)
    
    const mappedPlans = await Promise.all(plans.map(async (plan) => {
      const collaboratorRole = await studyPlanRepository.getCollaboratorRole(plan.id, BigInt(actor.id))

      return {
        id: Number(plan.id),
        userId: Number(plan.userId),
        name: plan.name,
        description: plan.description,

        isActive: plan.isActive,
        isShared: plan.isShared,
        collaboratorRole,
        canEditMetadata: actor.role === 'ADMIN' || plan.userId === BigInt(actor.id),
        canCreateSubjects:
          actor.role === 'ADMIN' ||
          plan.userId === BigInt(actor.id) ||
          collaboratorRole === 'CONTRIBUTOR',
        subjectsCount: await studyPlanRepository.countByStudyPlan(subjects, plan.id),
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      }
    }))

    return mappedPlans
  }

  async createStudyPlan(actorId: number, data: any) {

    const created = await studyPlanRepository.create({
      userId: BigInt(actorId),
      name: data.name,
      description: data.description ?? null,

      isActive: data.isActive,
      isShared: data.isShared,
    })

    return {
      id: Number(created.id),
      userId: Number(created.userId),
      name: created.name,
      description: created.description,

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
      const collaboratorRole = await studyPlanRepository.getCollaboratorRole(studyPlanId, BigInt(actor.id))
      const isCollaborator = collaboratorRole !== null

      if (isCollaborator && data.isActive !== undefined && data.name === undefined && data.description === undefined && data.isShared === undefined) {
      } else {
        throw new AppError('Nemate opravneni upravovat metadata tohoto planu.', 403)
      }
    }


    const updated = await studyPlanRepository.update(studyPlanId, {
      name: data.name,
      description: data.description,

      isActive: data.isActive,
      isShared: data.isShared,
    })

    return {
      id: Number(updated.id),
      userId: Number(updated.userId),
      name: updated.name,
      description: updated.description,

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

  async shareStudyPlan(studyPlanId: bigint, actor: { id: number, role: string, fullName?: string, email?: string }, data: { email: string, role: string }) {
    const plan = await studyPlanRepository.findById(studyPlanId)
    if (!plan) throw new AppError('Studijni plan nebyl nalezen.', 404)

    const canShare = actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)
    if (!canShare) {
      throw new AppError('Nemate opravneni sdilet tento plan.', 403)
    }

    const user = await studyPlanRepository.findUserByEmail(data.email)
    let targetUser = user
    let isNewUser = false
    if (!targetUser) {
      const [newDbUser] = await db
        .insert(users)
        .values({
          fullName: data.email.split('@')[0],
          email: data.email.toLowerCase(),
          role: 'PUBLIC',
        })
        .returning({ id: users.id, fullName: users.fullName, email: users.email })
      targetUser = newDbUser
      isNewUser = true
    }

    if (targetUser.id === plan.userId) {
      throw new AppError('Vlastnika planu nelze pridat jako spolupracovnika.', 400)
    }

    const collaborator = await studyPlanRepository.addCollaborator(studyPlanId, targetUser.id, data.role)

    if (isNewUser && env.RESEND_API_KEY) {
      try {
        const resend = new Resend(env.RESEND_API_KEY)
        const registerUrl = 'http://localhost:5173/login?mode=register'
        await resend.emails.send({
          from: 'Planner <onboarding@resend.dev>',
          to: data.email,
          subject: `Pozvánka do aplikace Planner`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #3b82f6;">Pozvánka do aplikace Planner!</h2>
              <p>Ahoj,</p>
              <p>Uživatel <strong>${actor.fullName || actor.email}</strong> s tebou chce sdílet studijní plán <strong>${plan.name}</strong> v aplikaci Planner.</p>
              <p>Tento e-mail k dané adrese nemá založený účet. Pro zobrazení sdíleného obsahu se prosím nejprve zaregistruj.</p>
              <div style="margin: 30px 0;">
                <a href="${registerUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Zaregistrovat se</a>
              </div>
              <p style="color: #666; font-size: 14px;">Tento e-mail byl automaticky vygenerován aplikací Planner.</p>
            </div>
          `
        })
      } catch (err) {
        console.error('Nepodařilo se odeslat pozvánku studijního plánu:', err)
      }
    }

    return {
      id: Number(collaborator.id),
      studyPlanId: Number(collaborator.studyPlanId),
      userId: Number(collaborator.userId),
      role: collaborator.role,
      user: {
        id: Number(targetUser.id),
        fullName: targetUser.fullName,
        email: targetUser.email,
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
