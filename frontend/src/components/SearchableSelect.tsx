import * as React from 'react'

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
  const rootRef = React.useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  React.useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? '')
    }
  }, [open, selected])

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
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

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <label htmlFor={id} className="block text-xs font-medium text-fg-muted">
        {label}
        <input type="hidden" name={name} value={value} />
        <input
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
      {open ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
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
              <li key={o.value}>
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
      ) : null}
    </div>
  )
}
