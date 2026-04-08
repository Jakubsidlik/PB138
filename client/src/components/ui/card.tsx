import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...props }: CardProps) {
  return <div className={`ui-card ${className}`.trim()} {...props} />
}

export function CardHeader({ className = '', ...props }: CardProps) {
  return <div className={`ui-card-header ${className}`.trim()} {...props} />
}

export function CardTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`ui-card-title ${className}`.trim()} {...props} />
}

export function CardContent({ className = '', ...props }: CardProps) {
  return <div className={`ui-card-content ${className}`.trim()} {...props} />
}