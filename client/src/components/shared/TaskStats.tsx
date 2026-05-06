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
      <div className={itemClassName}>
        <span className="stat-label">{totalLabel}</span>
        <span className="stat-value">{total}</span>
      </div>
      <div className={itemClassName}>
        <span className="stat-label">{completedLabel}</span>
        <span className="stat-value">{completed}</span>
      </div>
      <div className={itemClassName}>
        <span className="stat-label">{remainingLabel}</span>
        <span className="stat-value">{total - completed}</span>
      </div>
    </div>
  )
}