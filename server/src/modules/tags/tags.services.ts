import { AppError } from '../../middleware/error-handler.js'
import { tagsRepository } from './tags.repository.js'

class TagsService {
  async getTags(userId: number) {
    const rows = await tagsRepository.findAll(userId)
    return rows.map(r => ({
      id: Number(r.id),
      name: r.name,
      color: r.color,
      isSystem: r.isSystem
    }))
  }

  async createTag(userId: number, data: { name: string, color: string }) {
    const created = await tagsRepository.create({ ...data, userId })
    return {
      id: Number(created.id),
      name: created.name,
      color: created.color,
      isSystem: created.isSystem
    }
  }

  async deleteTag(tagId: number, userId: number) {
    const deleted = await tagsRepository.delete(tagId, userId)
    if (!deleted) {
      throw new AppError('Tag nebyl nalezen, nebo k nemu nemate prava (nelze smazat systemove tagy).', 404)
    }
    return { success: true }
  }
}

export const tagsService = new TagsService()
