export type UserRole = 'student' | 'registered'
export interface AuthSession {
  userId: number | string
  role: 'REGISTROVANÝ UŽIVATEL' | 'ADMIN'
  fullName: string
  email: string
}

export interface User {
  id: number
  fullName: string
  email: string
  role: 'REGISTROVANÝ UŽIVATEL' | 'ADMIN'
  school?: string
  studyMajor?: string
  studyYear?: string
  studyType?: string
  avatarDataUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  school?: string
  studyMajor?: string
  studyYear?: string
  studyType?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
}

export interface ApiError {
  error: string
}

export interface PaginatedResponse<T> {
  data: T[]
  hasMore: boolean
  nextCursor?: string | null
}

export type ThemeMode = 'light' | 'dark'
export type AccentPalette =
	| 'yellow-1'
	| 'yellow-2'
	| 'yellow-3'
	| 'yellow-4'
	| 'yellow-5'
	| 'mono-1'
	| 'mono-2'
	| 'mono-3'

export type UserProfile = {
  fullName: string
  email: string
  school: string
  studyMajor: string
  studyYear: string
  studyType: string
  avatarDataUrl: string | null
}

// ── Car-Y-list types ──────────────────────────────────────────────────

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export const TIER_ORDER: Tier[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F']

export const TIER_COLORS: Record<Tier, { bg: string; text: string; border: string; gradient: string }> = {
  S: { bg: '#ffd000', text: '#ffffff', border: '#e6bb00', gradient: 'linear-gradient(135deg, #ffd000 0%, #ffe04d 100%)' },
  A: { bg: '#e6bc19', text: '#ffffff', border: '#cca717', gradient: 'linear-gradient(135deg, #e6bc19 0%, #efcd4d 100%)' },
  B: { bg: '#cda933', text: '#ffffff', border: '#b8982e', gradient: 'linear-gradient(135deg, #cda933 0%, #d9bc66 100%)' },
  C: { bg: '#b3954d', text: '#ffffff', border: '#a18645', gradient: 'linear-gradient(135deg, #b3954d 0%, #bfab73 100%)' },
  D: { bg: '#9a8266', text: '#ffffff', border: '#8a755c', gradient: 'linear-gradient(135deg, #9a8266 0%, #a69580 100%)' },
  E: { bg: '#827466', text: '#ffffff', border: '#75685c', gradient: 'linear-gradient(135deg, #827466 0%, #8c8278 100%)' },
  F: { bg: '#4d4d4d', text: '#ffffff', border: '#454545', gradient: 'linear-gradient(135deg, #4d4d4d 0%, #666666 100%)' },
}

export interface Group {
  id: number
  name: string
  ownerId: number
  membersCount: number
  unratedCount: number
  createdAt: string
  updatedAt: string
}

export interface GroupMember {
  id: number
  groupId: number
  userId: number
  role: 'OWNER' | 'MEMBER'
  user: { id: number; fullName: string; email: string }
  createdAt?: string
}

export interface TierImage {
  id: number
  groupId: number
  name: string
  fileKey: string | null
  fileUrl: string | null
  size: number
  tier: Tier | null
  createdAt: string
  uploadedBy: {
    fullName: string
  }
  ratedBy?: {
    fullName: string
  }
}

export interface ImageComment {
  id: number
  imageId: number
  userId: number
  content: string
  createdAt: string
  userFullName: string
}

export interface ImageRating {
  imageId: number
  userId: number
  tier: Tier
  user: {
    id: number
    fullName: string
  }
}

export interface GroupResultImage {
  image: TierImage
  resultTier: Tier | null
  votes: ImageRating[]
}

export interface GroupResult {
  images: GroupResultImage[]
}

export interface TierCounts {
  S: number
  A: number
  B: number
  C: number
  D: number
  E: number
  F: number
  unrated: number
}

// ── Legacy types kept for FileRecord compatibility ────────────────────

export type FileCategory = 'folder' | 'pdf' | 'image' | 'document' | 'other'

export interface FileRecord {
  id: number
  name: string
  size: string
  sizeBytes: number
  category: FileCategory
  addedLabel: string
  isShared?: boolean
  userId?: number
  subjectId?: number | null
  deletedAt?: string | null
  likes?: number
  dislikes?: number
  userVote?: 'LIKE' | 'DISLIKE' | null
  userEmail?: string
  fileUrl?: string
  fileKey?: string
}

export interface ManagedFile extends FileRecord {
  shared?: boolean
}
