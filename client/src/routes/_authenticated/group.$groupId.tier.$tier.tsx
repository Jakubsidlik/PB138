import { createFileRoute } from '@tanstack/react-router'
import { TierGalleryComponent } from '../../app/routeScreens'

export const Route = createFileRoute('/_authenticated/group/$groupId/tier/$tier')({
  component: TierGalleryComponent,
})
