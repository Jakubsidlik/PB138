import { createRouter } from '@tanstack/react-router'
import { Route as RootRoute } from '../routes/__root'

export const router = createRouter({
  routeTree: RootRoute,
})