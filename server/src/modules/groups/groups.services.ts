import { groupsRepository } from './groups.repository'
import { AppError } from '../../middleware/error-handler'
import { db } from '../../db/client'
import { users } from '../../db/schema'
import { Resend } from 'resend'
import { env } from '../../env'

export class GroupsService {
  async getGroups(actor: { id: number }) {
    const rows = await groupsRepository.findAllByUser(BigInt(actor.id))

    const mapped = await Promise.all(rows.map(async (group) => {
      const membersCount = await groupsRepository.countMembers(group.id)
      const unratedCount = await groupsRepository.countUnratedImages(group.id)
      return {
        id: Number(group.id),
        name: group.name,
        ownerId: Number(group.ownerId),
        membersCount,
        unratedCount,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
      }
    }))

    return mapped
  }

  async getGroupDetail(groupId: bigint, actor: { id: number }) {
    const group = await groupsRepository.findById(groupId)
    if (!group) throw new AppError('Skupina nebyla nalezena.', 404)

    const isMember = await groupsRepository.isMember(groupId, BigInt(actor.id))
    if (!isMember) throw new AppError('Nemáte přístup k této skupině.', 403)

    const membersCount = await groupsRepository.countMembers(groupId)
    const unratedCount = await groupsRepository.countUnratedImages(groupId)

    return {
      id: Number(group.id),
      name: group.name,
      ownerId: Number(group.ownerId),
      membersCount,
      unratedCount,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    }
  }

  async createGroup(actor: { id: number }, data: { name: string }) {
    const created = await groupsRepository.create({
      name: data.name,
      ownerId: BigInt(actor.id),
    })

    // Auto-add creator as OWNER member
    await groupsRepository.addMember(created.id, BigInt(actor.id), 'OWNER')

    return {
      id: Number(created.id),
      name: created.name,
      ownerId: Number(created.ownerId),
      membersCount: 1,
      unratedCount: 0,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }
  }

  async updateGroup(groupId: bigint, actor: { id: number }, data: { name?: string }) {
    const group = await groupsRepository.findById(groupId)
    if (!group) throw new AppError('Skupina nebyla nalezena.', 404)

    if (group.ownerId !== BigInt(actor.id)) {
      throw new AppError('Pouze vlastník může upravovat skupinu.', 403)
    }

    const updated = await groupsRepository.update(groupId, data)
    return {
      id: Number(updated.id),
      name: updated.name,
      ownerId: Number(updated.ownerId),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  async deleteGroup(groupId: bigint, actor: { id: number }) {
    const group = await groupsRepository.findById(groupId)
    if (!group) throw new AppError('Skupina nebyla nalezena.', 404)

    if (group.ownerId !== BigInt(actor.id)) {
      throw new AppError('Pouze vlastník může smazat skupinu.', 403)
    }

    return groupsRepository.delete(groupId)
  }

  async getMembers(groupId: bigint, actor: { id: number }) {
    const isMember = await groupsRepository.isMember(groupId, BigInt(actor.id))
    if (!isMember) throw new AppError('Nemáte přístup k této skupině.', 403)

    const members = await groupsRepository.findMembers(groupId)
    return members.map((m) => ({
      id: Number(m.id),
      groupId: Number(m.groupId),
      userId: Number(m.userId),
      role: m.role,
      user: {
        id: Number(m.userId),
        fullName: m.userFullName,
        email: m.userEmail,
      },
      createdAt: m.createdAt.toISOString(),
    }))
  }

  async inviteMember(groupId: bigint, actor: { id: number; fullName?: string; email?: string }, data: { email: string }) {
    const group = await groupsRepository.findById(groupId)
    if (!group) throw new AppError('Skupina nebyla nalezena.', 404)

    const role = await groupsRepository.getMemberRole(groupId, BigInt(actor.id))
    if (!role) throw new AppError('Nemáte přístup k této skupině.', 403)

    // Find or create target user
    let targetUser = await groupsRepository.findUserByEmail(data.email)
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

    if (targetUser.id === BigInt(actor.id)) {
      throw new AppError('Nemůžete pozvat sami sebe.', 400)
    }

    // Check if already member
    const alreadyMember = await groupsRepository.isMember(groupId, targetUser.id)
    if (alreadyMember) {
      throw new AppError('Uživatel je již členem skupiny.', 400)
    }

    const member = await groupsRepository.addMember(groupId, targetUser.id, 'MEMBER')

    // Send email notification
    try {
      if (env.RESEND_API_KEY) {
        const resend = new Resend(env.RESEND_API_KEY)

        if (isNewUser) {
          const registerUrl = 'http://localhost:5173/login?mode=register'
          await resend.emails.send({
            from: 'Car-Y-list <onboarding@resend.dev>',
            to: data.email,
            subject: `Pozvánka do aplikace Car-Y-list`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #f59e0b;">Pozvánka do Car-Y-list!</h2>
                <p>Ahoj,</p>
                <p>Uživatel <strong>${actor.fullName || actor.email}</strong> tě pozval do skupiny <strong>${group.name}</strong> v aplikaci Car-Y-list.</p>
                <p>Tento e-mail nemá založený účet. Pro zobrazení obsahu se prosím nejprve zaregistruj.</p>
                <div style="margin: 30px 0;">
                  <a href="${registerUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Zaregistrovat se</a>
                </div>
                <p style="color: #666; font-size: 14px;">Tento e-mail byl automaticky vygenerován aplikací Car-Y-list.</p>
              </div>
            `
          })
        } else {
          await resend.emails.send({
            from: 'Car-Y-list <onboarding@resend.dev>',
            to: data.email,
            subject: `Pozvánka do skupiny: ${group.name}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #f59e0b;">Nová pozvánka do skupiny!</h2>
                <p>Ahoj,</p>
                <p>Uživatel <strong>${actor.fullName || actor.email}</strong> tě pozval do skupiny <strong>${group.name}</strong> v aplikaci Car-Y-list.</p>
                <div style="margin: 30px 0;">
                  <a href="http://localhost:5173/" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Otevřít v aplikaci</a>
                </div>
                <p style="color: #666; font-size: 14px;">Tento e-mail byl automaticky vygenerován aplikací Car-Y-list.</p>
              </div>
            `
          })
        }
      }
    } catch (emailError) {
      console.error('Nepodařilo se odeslat pozvánku:', emailError)
    }

    return {
      id: member ? Number(member.id) : 0,
      groupId: Number(groupId),
      userId: Number(targetUser.id),
      role: 'MEMBER' as const,
      user: {
        id: Number(targetUser.id),
        fullName: targetUser.fullName,
        email: targetUser.email,
      },
    }
  }

  async removeMember(groupId: bigint, targetUserId: bigint, actor: { id: number }) {
    const group = await groupsRepository.findById(groupId)
    if (!group) throw new AppError('Skupina nebyla nalezena.', 404)

    // Owner can remove anyone, member can leave
    const isOwner = group.ownerId === BigInt(actor.id)
    const isSelf = targetUserId === BigInt(actor.id)

    if (!isOwner && !isSelf) {
      throw new AppError('Nemáte oprávnění odebrat tohoto člena.', 403)
    }

    if (isOwner && isSelf) {
      throw new AppError('Vlastník nemůže opustit skupinu. Nejprve ji smažte.', 400)
    }

    return groupsRepository.removeMember(groupId, targetUserId)
  }
}

export const groupsService = new GroupsService()
