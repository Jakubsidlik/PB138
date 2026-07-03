import { commentsRepository } from './comments.repository'
import { groupsRepository } from '../groups/groups.repository'
import { imagesRepository } from '../images/images.repository'
import { AppError } from '../../middleware/error-handler'
import type { DbUser } from '../../db/schema'

export const commentsServices = {
  async getComments(groupId: bigint, imageId: bigint, actor: Pick<DbUser, 'id' | 'role'>) {
    if (actor.role !== 'ADMIN') {
      const isMember = await groupsRepository.isMember(groupId, actor.id)
      if (!isMember) throw new AppError('Přístup odepřen.', 403)
    }

    const image = await imagesRepository.findById(imageId)
    if (!image || image.groupId !== groupId) {
      throw new AppError('Obrázek nenalezen v dané skupině.', 404)
    }

    return commentsRepository.findByImage(imageId)
  },

  async addComment(groupId: bigint, imageId: bigint, actor: Pick<DbUser, 'id' | 'role'>, content: string) {
    if (actor.role !== 'ADMIN') {
      const isMember = await groupsRepository.isMember(groupId, actor.id)
      if (!isMember) throw new AppError('Přístup odepřen.', 403)
    }

    const image = await imagesRepository.findById(imageId)
    if (!image || image.groupId !== groupId) {
      throw new AppError('Obrázek nenalezen v dané skupině.', 404)
    }

    const comment = await commentsRepository.create({
      imageId,
      userId: actor.id,
      content,
    })

    return comment
  },

  async deleteComment(groupId: bigint, imageId: bigint, commentId: bigint, actor: Pick<DbUser, 'id' | 'role'>) {
    const comment = await commentsRepository.findById(commentId)
    if (!comment || comment.imageId !== imageId) {
      throw new AppError('Komentář nenalezen.', 404)
    }

    if (actor.role !== 'ADMIN' && comment.userId !== actor.id) {
      const memberRole = await groupsRepository.getMemberRole(groupId, actor.id)
      if (memberRole !== 'OWNER') {
        throw new AppError('Přístup odepřen.', 403)
      }
    }

    await commentsRepository.delete(commentId)
    return { success: true }
  },
}
