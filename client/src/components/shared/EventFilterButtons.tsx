import { Button } from '../ui/button'

type EventFilterButtonsProps = {
  eventFilter: 'future' | 'past'
  onFilterChange: (filter: 'future' | 'past') => void
}

export function EventFilterButtons({ eventFilter, onFilterChange }: EventFilterButtonsProps) {
  return (
    <div className="event-filter-buttons">
      <Button
        type="button"
        onClick={() => onFilterChange('future')}
        className={eventFilter === 'future' ? 'active' : ''}
      >
        Budoucí
      </Button>
      <Button
        type="button"
        onClick={() => onFilterChange('past')}
        className={eventFilter === 'past' ? 'active' : ''}
      >
        Minulé
      </Button>
    </div>
  )
}
