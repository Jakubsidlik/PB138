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
      <div className={itemClassName || "rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-center items-center gap-2"}>
        <span className="text-sm font-medium text-muted-foreground">{totalLabel}</span>
        <span className="text-3xl font-bold">{total}</span>
      </div>
      <div className={itemClassName || "rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-center items-center gap-2"}>
        <span className="text-sm font-medium text-muted-foreground">{completedLabel}</span>
        <span className="text-3xl font-bold">{completed}</span>
      </div>
      <div className={itemClassName || "rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-center items-center gap-2"}>
        <span className="text-sm font-medium text-muted-foreground">{remainingLabel}</span>
        <span className="text-3xl font-bold">{total - completed}</span>
      </div>
    </div>
  )
}