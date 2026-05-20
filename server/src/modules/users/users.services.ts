import { clerkClient } from '@clerk/express'
import { db } from '../../db/client.js'
import { users } from '../../db/schema.js'
import { usersRepository } from './users.repository.js'
import { AppError } from '../../middleware/error-handler.js'
import { toDateOnlyIso } from '../../utils.js'
import { UserRole } from '../../db/schema.js'

export class UsersService {
  async getAllUsers() {
    try {
      const clerkUsers = await clerkClient.users.getUserList()
      const dbUsers = await db.select({ email: users.email, clerkId: users.clerkId }).from(users)
      const dbEmails = new Set(dbUsers.map(u => u.email.toLowerCase()))
      const dbClerkIds = new Set(dbUsers.map(u => u.clerkId).filter(Boolean))

      for (const cu of clerkUsers.data) {
        const email = cu.emailAddresses[0]?.emailAddress?.toLowerCase()
        if (!email) continue

        if (!dbEmails.has(email) && !dbClerkIds.has(cu.id)) {
          const fullName = `${cu.firstName || ''} ${cu.lastName || ''}`.trim() || 'Uživatel'
          await db.insert(users).values({
            clerkId: cu.id,
            email,
            fullName,
            role: 'REGISTERED'
          })
          dbEmails.add(email)
          dbClerkIds.add(cu.id)
        }
      }
    } catch (err) {
      console.error('Chyba při synchronizaci uživatelů z Clerku:', err)
    }

    const rows = await usersRepository.findAll()
    return rows.map((user: any) => ({
      id: Number(user.id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatarDataUrl: user.hasAvatar ? 'has_avatar' : null,
    }))
  }

  async getProfile(actorId: number) {
    const user = await usersRepository.findById(BigInt(actorId))
    if (!user) {
      throw new AppError('Profil nebyl nalezen.', 404)
    }

    return {
      id: Number(user.id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      school: user.school ?? '',
      faculty: user.faculty,
      studyMajor: user.studyMajor ?? '',
      studyYear: user.studyYear ?? '',
      studyType: user.studyType ?? '',

      avatarDataUrl: user.avatarDataUrl,
      contactEmail: user.contactEmail,
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  async createProfile(data: any) {
    const existingUser = await usersRepository.findFirstActive()
    if (existingUser) {
      throw new AppError('Profil uz existuje. Pouzijte PUT /api/profile.', 409)
    }



    const defaultUserPayload = {
      passwordHash: 'demo-password',
      role: 'REGISTERED' as UserRole,
      school: null as string | null,
      faculty: null as string | null,
      studyMajor: null as string | null,
      studyYear: null as string | null,
      studyType: null as string | null,

      avatarDataUrl: null as string | null,
    }

    let role = data.role ?? defaultUserPayload.role
    if (data.email.toLowerCase() === 'admin.lonelystudent@proton.me') {
      role = 'ADMIN' as UserRole
    }

    const created = await usersRepository.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash: data.password ?? defaultUserPayload.passwordHash,
      role: role,
      school: data.school ?? null,
      faculty: data.faculty ?? null,
      studyMajor: data.studyMajor ?? null,
      studyYear: data.studyYear ?? null,
      studyType: data.studyType ?? null,

      avatarDataUrl: data.avatarDataUrl ?? null,
      contactEmail: data.contactEmail ?? null,
    })

    return {
      id: Number(created.id),
      fullName: created.fullName,
      email: created.email,
      role: created.role,
      school: created.school ?? '',
      faculty: created.faculty,
      studyMajor: created.studyMajor ?? '',
      studyYear: created.studyYear ?? '',
      studyType: created.studyType ?? '',

      avatarDataUrl: created.avatarDataUrl,
      contactEmail: created.contactEmail,
    }
  }

  async updateProfile(actorId: number, actorRole: string, data: any) {


    const updatePayload: any = {
      fullName: data.fullName,
      school: data.school,
      faculty: data.faculty,
      studyMajor: data.studyMajor,
      studyYear: data.studyYear,
      studyType: data.studyType,

      avatarDataUrl: data.avatarDataUrl,
      contactEmail: data.contactEmail,
    }

    if (actorRole === 'ADMIN' && data.role !== undefined) {
      updatePayload.role = data.role
    }

    const updated = await usersRepository.update(BigInt(actorId), updatePayload)

    return {
      id: Number(updated.id),
      fullName: updated.fullName,
      email: updated.email,
      role: updated.role,
      school: updated.school ?? '',
      faculty: updated.faculty,
      studyMajor: updated.studyMajor ?? '',
      studyYear: updated.studyYear ?? '',
      studyType: updated.studyType ?? '',

      avatarDataUrl: updated.avatarDataUrl,
      contactEmail: updated.contactEmail,
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  async deleteProfile(actorId: number) {
    const existing = await usersRepository.findById(BigInt(actorId))
    if (!existing) {
      throw new AppError('Profil nebyl nalezen.', 404)
    }

    return usersRepository.softDelete(BigInt(actorId))
  }

  async adminUpdateUser(userId: bigint, data: any) {
    const existing = await usersRepository.findById(userId)
    if (!existing) {
      throw new AppError('Uzivatel nebyl nalezen.', 404)
    }

    const updateData: any = {}
    if (data.role !== undefined) updateData.role = data.role
    if (data.avatarDataUrl !== undefined) updateData.avatarDataUrl = data.avatarDataUrl

    const updated = await usersRepository.update(userId, updateData)
    return updated
  }

  async adminDeleteUser(userId: bigint) {
    const existing = await usersRepository.findById(userId)
    if (!existing) {
      throw new AppError('Uzivatel nebyl nalezen.', 404)
    }

    return usersRepository.softDelete(userId)
  }
}

export const usersService = new UsersService()
