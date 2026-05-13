import { usersRepository } from './users.repository.js'
import { AppError } from '../../middleware/error-handler.js'
import { toDateOnlyIso, parseOptionalDate } from '../../utils.js'
import { UserRole } from '../../db/schema.js'

export class UsersService {
  async getAllUsers() {
    const rows = await usersRepository.findAll()
    return rows.map((user) => ({
      id: Number(user.id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      school: user.school ?? '',
      faculty: user.faculty,
      studyMajor: user.studyMajor ?? '',
      studyYear: user.studyYear ?? '',
      studyType: user.studyType ?? '',
      birthDate: user.birthDate ? toDateOnlyIso(user.birthDate) : null,
      bio: user.bio,
      avatarDataUrl: user.avatarDataUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
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
      birthDate: user.birthDate ? toDateOnlyIso(user.birthDate) : null,
      bio: user.bio,
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

    const parsedBirthDate = parseOptionalDate(data.birthDate)
    if (data.birthDate !== undefined && parsedBirthDate === undefined) {
      throw new AppError('Neplatny format birthDate.', 400)
    }

    const defaultUserPayload = {
      passwordHash: 'demo-password',
      role: 'REGISTERED' as UserRole,
      school: null as string | null,
      faculty: null as string | null,
      studyMajor: null as string | null,
      studyYear: null as string | null,
      studyType: null as string | null,
      birthDate: null as Date | null,
      bio: null as string | null,
      avatarDataUrl: null as string | null,
    }

    const created = await usersRepository.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash: data.password ?? defaultUserPayload.passwordHash,
      role: data.role ?? defaultUserPayload.role,
      school: data.school ?? null,
      faculty: data.faculty ?? null,
      studyMajor: data.studyMajor ?? null,
      studyYear: data.studyYear ?? null,
      studyType: data.studyType ?? null,
      birthDate: parsedBirthDate ?? null,
      bio: data.bio ?? null,
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
      birthDate: created.birthDate ? toDateOnlyIso(created.birthDate) : null,
      bio: created.bio,
      avatarDataUrl: created.avatarDataUrl,
      contactEmail: created.contactEmail,
    }
  }

  async updateProfile(actorId: number, actorRole: string, data: any) {
    const parsedBirthDate = parseOptionalDate(data.birthDate)
    if (data.birthDate !== undefined && parsedBirthDate === undefined) {
      throw new AppError('Neplatny format birthDate.', 400)
    }

    const updatePayload: any = {
      fullName: data.fullName,
      school: data.school,
      faculty: data.faculty,
      studyMajor: data.studyMajor,
      studyYear: data.studyYear,
      studyType: data.studyType,
      birthDate: parsedBirthDate ?? undefined,
      bio: data.bio,
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
      birthDate: updated.birthDate ? toDateOnlyIso(updated.birthDate) : null,
      bio: updated.bio,
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
}

export const usersService = new UsersService()
