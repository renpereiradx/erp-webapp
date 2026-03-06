import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Select({ ...props }) {
  return (
    <SelectPrimitive.Root
      data-slot='select'
      data-testid={props['data-testid'] ?? 'select-root'}
      {...props}
    />
  )
}

function SelectGroup({ ...props }) {
  return <SelectPrimitive.Group data-slot='select-group' {...props} />
}

function SelectValue({ ...props }) {
  return (
    <SelectPrimitive.Value
      data-slot='select-value'
      data-testid={props['data-testid'] ?? 'select-value'}
      {...props}
    />
  )
}

function SelectTrigger({ className, size = 'default', children, ...props }) {
  return (
    <SelectPrimitive.Trigger
      data-slot='select-trigger'
      data-size={size}
      data-testid={props['data-testid'] ?? `select-trigger-${size}`}
      className={cn(
        "border-slate-200 dark:border-slate-800 data-[placeholder]:text-slate-400 [&_svg:not([class*='text-'])]:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 dark:bg-slate-900/50 dark:hover:bg-slate-900 flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-sm whitespace-nowrap shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-10 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 font-bold uppercase text-[10px] tracking-widest",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className='size-4 opacity-50' />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({ className, children, position = 'popper', ...props }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot='select-content'
        data-testid={props['data-testid'] ?? 'select-content'}
        className={cn(
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 relative z-[9999] max-h-[var(--radix-select-content-available-height)] min-w-[8rem] origin-[var(--radix-select-content-transform-origin)] overflow-x-hidden overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-fluent-16',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-testid={props['data-testidViewport'] ?? 'select-viewport'}
          className={cn(
            'p-1.5',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }) {
  return (
    <SelectPrimitive.Label
      data-slot='select-label'
      data-testid={props['data-testid'] ?? 'select-label'}
      className={cn('text-slate-400 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest', className)}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }) {
  return (
    <SelectPrimitive.Item
      data-slot='select-item'
      data-testid={props['data-testid'] ?? 'select-item'}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-[10px] font-bold uppercase tracking-widest outline-none transition-colors focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='text-'])]:text-slate-400",
        className
      )}
      {...props}
    >
      <span className='absolute right-2 flex h-3.5 w-3.5 items-center justify-center'>
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className='size-4' />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }) {
  return (
    <SelectPrimitive.Separator
      data-slot='select-separator'
      className={cn('bg-slate-100 dark:bg-slate-800 -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot='select-scroll-up-button'
      data-testid={props['data-testid'] ?? 'select-scroll-up-button'}
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className
      )}
      {...props}
    >
      <ChevronUpIcon className='size-4' />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot='select-scroll-down-button'
      data-testid={props['data-testid'] ?? 'select-scroll-down-button'}
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className
      )}
      {...props}
    >
      <ChevronDownIcon className='size-4' />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
