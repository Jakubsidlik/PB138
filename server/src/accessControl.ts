import { AuthActor } from './types'

export const isPublicActor = (actor: AuthActor): boolean => {
  return actor.role === 'PUBLIC'
}

export const canAccessProtectedResource = (actor: AuthActor): boolean => {
  return actor.role === 'REGISTERED' || actor.role === 'ADMIN'
}
