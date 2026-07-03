import type {
  ApiError,
  AuthResponse,
  Group,
  GroupMember,
  LoginRequest,
  RegisterRequest,
  TierImage,
  TierCounts,
  Tier,
  User,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class ApiClient {
  private userId: number | null = null
  private token: string | null = null

  setUserId(userId: number | null) {
    this.userId = userId
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${API_BASE_URL}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.userId !== null) {
      headers['x-user-id'] = String(this.userId)
    }

    if (this.token !== null) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      let errorMessage = 'API Error'
      try {
        const errorData = (await response.json()) as ApiError
        errorMessage = errorData.error || errorMessage
      } catch {
      }
      throw new Error(errorMessage)
    }

    const data = (await response.json()) as T
    return data
  }

  // ── Health ────────────────────────────────────────────────────────────

  async health() {
    return this.request('GET', '/api/health')
  }

  // ── Auth ──────────────────────────────────────────────────────────────

  async register(payload: RegisterRequest) {
    return this.request<AuthResponse>('POST', '/api/auth/register', payload)
  }

  async login(payload: LoginRequest) {
    return this.request<AuthResponse>('POST', '/api/auth/login', payload)
  }

  // ── Users / Profile ───────────────────────────────────────────────────

  async getUsers() {
    return this.request<User[]>('GET', '/api/users')
  }

  async adminUpdateUser(id: number, data: any) {
    return this.request<User>('PUT', `/api/users/${id}`, data)
  }

  async adminDeleteUser(id: number) {
    return this.request<{ success: boolean }>('DELETE', `/api/users/${id}`)
  }

  async getProfile() {
    return this.request<User>('GET', '/api/profile')
  }

  async updateProfile(payload: Partial<User>) {
    return this.request<User>('PUT', '/api/profile', payload)
  }

  async uploadAvatar(avatarDataUrl: string) {
    return this.request<User>('POST', '/api/profile', { avatarDataUrl })
  }

  async deleteProfile() {
    return this.request('DELETE', '/api/profile')
  }

  // ── Groups ────────────────────────────────────────────────────────────

  async getGroups() {
    return this.request<Group[]>('GET', '/api/groups')
  }

  async getGroup(id: number) {
    return this.request<Group>('GET', `/api/groups/${id}`)
  }

  async createGroup(payload: { name: string }) {
    return this.request<Group>('POST', '/api/groups', payload)
  }

  async updateGroup(id: number, payload: { name?: string }) {
    return this.request<Group>('PATCH', `/api/groups/${id}`, payload)
  }

  async deleteGroup(id: number) {
    return this.request<{ success: boolean }>('DELETE', `/api/groups/${id}`)
  }

  async getGroupMembers(id: number) {
    return this.request<GroupMember[]>('GET', `/api/groups/${id}/members`)
  }

  async inviteToGroup(id: number, payload: { email: string }) {
    return this.request<GroupMember>('POST', `/api/groups/${id}/invite`, payload)
  }

  async removeGroupMember(groupId: number, userId: number) {
    return this.request<{ success: boolean }>('DELETE', `/api/groups/${groupId}/members/${userId}`)
  }

  // ── Images ────────────────────────────────────────────────────────────

  async getGroupImages(groupId: number, tier?: Tier) {
    const query = tier ? `?tier=${tier}` : ''
    return this.request<TierImage[]>('GET', `/api/groups/${groupId}/images${query}`)
  }

  async getUnratedImages(groupId: number) {
    return this.request<TierImage[]>('GET', `/api/groups/${groupId}/images/unrated`)
  }

  async getTierCounts(groupId: number) {
    return this.request<TierCounts>('GET', `/api/groups/${groupId}/images/counts`)
  }

  async getImageUploadUrl(groupId: number, payload: { filename: string; contentType: string }) {
    return this.request<{ uploadUrl: string; fileKey: string; fileUrl: string }>(
      'POST', `/api/groups/${groupId}/images/upload-url`, payload
    )
  }

  async createImage(groupId: number, payload: { name: string; size: number; fileKey?: string; fileUrl?: string }) {
    return this.request<TierImage>('POST', `/api/groups/${groupId}/images`, payload)
  }

  async setImageTier(groupId: number, imageId: number, tier: Tier) {
    return this.request<TierImage>('PATCH', `/api/groups/${groupId}/images/${imageId}/tier`, { tier })
  }

  async deleteImage(groupId: number, imageId: number) {
    return this.request<{ success: boolean }>('DELETE', `/api/groups/${groupId}/images/${imageId}`)
  }

  // ── Comments ──────────────────────────────────────────────────────────

  async getComments(groupId: number, imageId: number) {
    return this.request<import('./types').ImageComment[]>('GET', `/api/groups/${groupId}/images/${imageId}/comments`)
  }

  async addComment(groupId: number, imageId: number, payload: { content: string }) {
    return this.request<import('./types').ImageComment>('POST', `/api/groups/${groupId}/images/${imageId}/comments`, payload)
  }

  async deleteComment(groupId: number, imageId: number, commentId: number) {
    return this.request<{ success: boolean }>('DELETE', `/api/groups/${groupId}/images/${imageId}/comments/${commentId}`)
  }

  // ── Ratings ───────────────────────────────────────────────────────────

  async rateImage(groupId: number, imageId: number, tier: Tier) {
    return this.request<import('./types').ImageRating>('POST', `/api/groups/${groupId}/images/${imageId}/rate`, { tier })
  }

  async getGroupResult(groupId: number) {
    return this.request<import('./types').GroupResult>('GET', `/api/groups/${groupId}/result`)
  }

  async getMyRatings(groupId: number) {
    return this.request<import('./types').ImageRating[]>('GET', `/api/groups/${groupId}/my-ratings`)
  }
}

export const apiClient = new ApiClient()
