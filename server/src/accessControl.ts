import { AuthActor } from './types.js'

export const isPublicActor = (actor: AuthActor): boolean => {
  return actor.role === 'PUBLIC'
}

export const canAccessProtectedResource = (actor: AuthActor): boolean => {
  return actor.role === 'REGISTERED' || actor.role === 'ADMIN'
}
