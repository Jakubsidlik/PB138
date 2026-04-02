import * as React from 'react'

import { cn } from '@/lib/utils'

function Separator({ className, orientation = 'horizontal', decorative = true, ...props }: React.HTMLAttributes<HTMLHRElement> & { orientation?: 'horizontal' | 'vertical'; decorative?: boolean }) {
  return (
    <hr
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      aria-hidden={decorative}
      {...props}
    />
  )
}

export { Separator }
