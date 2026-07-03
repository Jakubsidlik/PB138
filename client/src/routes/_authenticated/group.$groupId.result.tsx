import { createFileRoute } from '@tanstack/react-router'
import { GroupResultScreen } from '../../screen/GroupResultScreen'

export const Route = createFileRoute('/_authenticated/group/$groupId/result')({
  component: () => {
    const { groupId } = Route.useParams()
    return <GroupResultScreen groupId={Number(groupId)} />
  },
})
