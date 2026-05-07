import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

type EventFilterButtonsProps = {
  eventFilter: 'future' | 'past'
  onFilterChange: (filter: 'future' | 'past') => void
}

export function EventFilterButtons({ eventFilter, onFilterChange }: EventFilterButtonsProps) {
  return (
    <ToggleGroup type="single" value={eventFilter} onValueChange={(value) => onFilterChange(value as 'future' | 'past')} className="event-filter-buttons">
      <ToggleGroupItem value="future" aria-label="Budoucí">
        Budoucí
      </ToggleGroupItem>
      <ToggleGroupItem value="past" aria-label="Minulé">
        Minulé
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
