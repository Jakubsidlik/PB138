import { createFileRoute } from '@tanstack/react-router'
import { FilesComponent } from '../../app/routeScreens'

export const Route = createFileRoute('/_authenticated/files')({
  component: FilesComponent,
})
