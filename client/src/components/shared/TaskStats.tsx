import { Card, CardContent } from '../ui/card'

type TaskStatsProps = {
  totalLabel: string
  completedLabel: string
  remainingLabel: string
  total: number
  completed: number
  wrapperClassName?: string
  itemClassName?: string
}

export function TaskStats({
  totalLabel,
  completedLabel,
  remainingLabel,
  total,
  completed,
  wrapperClassName,
  itemClassName,
}: TaskStatsProps) {
  return (
    <div className={wrapperClassName}>
      <Card className={itemClassName}>
        <CardContent className="pt-6">
          <p className="stat-label text-sm text-muted-foreground">{totalLabel}</p>
          <p className="stat-value text-2xl font-bold mt-2">{total}</p>
        </CardContent>
      </Card>
      <Card className={itemClassName}>
        <CardContent className="pt-6">
          <p className="stat-label text-sm text-muted-foreground">{completedLabel}</p>
          <p className="stat-value text-2xl font-bold mt-2">{completed}</p>
        </CardContent>
      </Card>
      <Card className={itemClassName}>
        <CardContent className="pt-6">
          <p className="stat-label text-sm text-muted-foreground">{remainingLabel}</p>
          <p className="stat-value text-2xl font-bold mt-2">{total - completed}</p>
        </CardContent>
      </Card>
    </div>
  )
}