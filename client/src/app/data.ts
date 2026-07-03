import {
  UserProfile,
} from './types'

export const THEME_STORAGE_KEY = 'pb138.theme'
export const PALETTE_STORAGE_KEY = 'pb138.palette'
export const PROFILE_STORAGE_KEY = 'pb138.profile'

export const userProfileSeed: UserProfile = {
  fullName: '',
  email: '',
  school: '',
  studyMajor: '',
  studyYear: '',
  studyType: '',
  avatarDataUrl: null,
}
