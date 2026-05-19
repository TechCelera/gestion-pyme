import * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { type VariantProps } from 'class-variance-authority'

import { inputControlVariants } from '@/components/ui/form-control-styles'
import { cn } from '@/lib/utils'

export type InputProps = React.ComponentProps<'input'> &
  VariantProps<typeof inputControlVariants>

function Input({ className, type, controlSize, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputControlVariants({ controlSize }), className)}
      {...props}
    />
  )
}

export { Input }
