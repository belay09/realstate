import * as React from 'react'
import { createPortal } from 'react-dom'

export type SelectOption = {
  value: string
  label: string
}

type SearchableSelectProps = {
  id: string
  name: string
  label: string
  value: string
  options: SelectOption[]
  placeholder: string
  emptyLabel: string
  onChange: (value: string) => void
  className?: string
}

type MenuPosition = {
  left: number
  width: number
  top: number
  maxHeight: number
  openUp: boolean
}

function measureMenu(anchor: HTMLElement): MenuPosition {
  const rect = anchor.getBoundingClientRect()
  const gap = 4
  const preferredMax = 224
  const spaceBelow = window.innerHeight - rect.bottom - gap
  const spaceAbove = rect.top - gap
  const openUp = spaceBelow < 160 && spaceAbove > spaceBelow
  const maxHeight = Math.min(preferredMax, openUp ? spaceAbove : spaceBelow)
  const top = openUp ? rect.top - gap : rect.bottom + gap

  return { left: rect.left, width: rect.width, top, maxHeight: Math.max(120, maxHeight), openUp }
}

export function SearchableSelect({
  id,
  name,
  label,
  value,
  options,
  placeholder,
  emptyLabel,
  onChange,
  className = '',
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [menuStyle, setMenuStyle] = React.useState<MenuPosition | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const updateMenuPosition = React.useCallback(() => {
    if (!inputRef.current) return
    setMenuStyle(measureMenu(inputRef.current))
  }, [])

  React.useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? '')
    }
  }, [open, selected])

  React.useEffect(() => {
    if (!open) return
    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open, updateMenuPosition])

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement
        if (!target.closest('[data-searchable-select-menu]')) {
          setOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const normalized = query.trim().toLowerCase()
  const filtered = options.filter((o) => {
    if (!normalized) return true
    return (
      o.label.toLowerCase().includes(normalized) || o.value.toLowerCase().includes(normalized)
    )
  })

  const pick = (next: string) => {
    onChange(next)
    const opt = options.find((o) => o.value === next)
    setQuery(opt?.label ?? '')
    setOpen(false)
  }

  const menu =
    open && menuStyle ? (
      <ul
        role="listbox"
        data-searchable-select-menu
        className="fixed z-[200] overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
        style={{
          left: menuStyle.left,
          width: menuStyle.width,
          top: menuStyle.top,
          maxHeight: menuStyle.maxHeight,
          transform: menuStyle.openUp ? 'translateY(-100%)' : undefined,
        }}
      >
        <li>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm text-fg-muted hover:bg-brand-50 dark:hover:bg-brand-950"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick('')}
          >
            {emptyLabel}
          </button>
        </li>
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-sm text-fg-muted">{placeholder}</li>
        ) : (
          filtered.map((o) => (
            <li key={o.value || '__empty__'}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-brand-50 dark:hover:bg-brand-950 ${
                  o.value === value ? 'font-semibold text-brand-800 dark:text-brand-200' : 'text-fg'
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o.value)}
              >
                {o.label}
              </button>
            </li>
          ))
        )}
      </ul>
    ) : null

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <label htmlFor={id} className="block text-xs font-medium text-fg-muted">
        {label}
        <input type="hidden" name={name} value={value} />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          className="input mt-1"
          placeholder={placeholder}
          value={open ? query : (selected?.label ?? '')}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!e.target.value.trim()) {
              onChange('')
            }
          }}
          onFocus={() => {
            setQuery(selected?.label ?? '')
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              setQuery(selected?.label ?? '')
            }
            if (e.key === 'Enter' && open && filtered.length === 1) {
              e.preventDefault()
              pick(filtered[0].value)
            }
          }}
        />
      </label>
      {menu ? createPortal(menu, document.body) : null}
    </div>
  )
}
