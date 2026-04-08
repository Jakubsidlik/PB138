import type { HTMLAttributes } from 'react'

type BadgeVariant = 'secondary' | 'outline' | 'student' | 'registered' | 'public'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

export function Badge({ className = '', variant = 'secondary', ...props }: BadgeProps) {
  return <span className={`ui-badge ui-badge-${variant} ${className}`.trim()} {...props} />
}