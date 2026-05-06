import React from 'react'
import { Button } from '../ui/button'

type MonthSwitcherProps = {
  monthLabel: string
  setDisplayMonth: React.Dispatch<React.SetStateAction<Date>>
  className?: string
  prevAriaLabel?: string
  nextAriaLabel?: string
  prevClassName?: string
  nextClassName?: string
}

export function MonthSwitcher({
  monthLabel,
  setDisplayMonth,
  className = 'month-switch',
  prevAriaLabel = 'Předchozí měsíc',
  nextAriaLabel = 'Další měsíc',
  prevClassName,
  nextClassName,
}: MonthSwitcherProps) {
  return (
    <div className={className}>
      <Button
        type="button"
        className={prevClassName}
        aria-label={prevAriaLabel}
        onClick={() =>
          setDisplayMonth(
            (prevMonth) =>
              new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1),
          )
        }
      >
        ‹
      </Button>
      <span>{monthLabel}</span>
      <Button
        type="button"
        className={nextClassName}
        aria-label={nextAriaLabel}
        onClick={() =>
          setDisplayMonth(
            (prevMonth) =>
              new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1),
          )
        }
      >
        ›
      </Button>
    </div>
  )
}
