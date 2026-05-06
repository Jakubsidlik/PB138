import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'

import { RootLayout } from '../components/layout/RootLayout'
import {
  HomeRouteScreen,
  CalendarRouteScreen,
  FilesRouteScreen,
  TasksRouteScreen,
  StudyPlanRouteScreen,
  ProfileRouteScreen,
} from './routeScreens'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeRouteScreen,
})

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarRouteScreen,
})

const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/files',
  component: FilesRouteScreen,
})

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: TasksRouteScreen,
})

const studyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/study',
  component: StudyPlanRouteScreen,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfileRouteScreen,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  calendarRoute,
  filesRoute,
  tasksRoute,
  studyRoute,
  profileRoute,
])

export const router = createRouter({
  routeTree,
})