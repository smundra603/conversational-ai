import Button from 'components/common/Button'
import React, { useEffect, useMemo, useRef, useState } from 'react'

export type DateRangePreset = {
  label: string
  getRange: () => { start: string; end: string }
}

interface Props {
  startDate: string
  endDate: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  presets?: DateRangePreset[]
  className?: string
}

const DateRangeFilter: React.FC<Props> = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  presets = [],
  className
}) => {
  const [open, setOpen] = useState(false)
  const [tempStart, setTempStart] = useState(startDate)
  const [tempEnd, setTempEnd] = useState(endDate)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync temp values when opening the dropdown or when props change
  useEffect(() => {
    if (open) {
      setTempStart(startDate)
      setTempEnd(endDate)
    }
  }, [open, startDate, endDate])

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return

    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const applyPreset = (preset: DateRangePreset) => {
    const { start, end } = preset.getRange()
    onStartChange(start)
    onEndChange(end)
    setOpen(false)
  }

  const applyCustom = () => {
    onStartChange(tempStart)
    onEndChange(tempEnd)
    setOpen(false)
  }

  const triggerLabel = useMemo(() => {
    const matched = presets.find((p) => {
      const r = p.getRange()
      return r.start === startDate && r.end === endDate
    })
    if (matched) return matched.label

    const fmt = (d: string) => {
      if (!d) return ''
      const date = new Date(d)
      if (Number.isNaN(date.getTime())) return d
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      })
    }
    if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`
    if (startDate) return `From ${fmt(startDate)}`
    if (endDate) return `Until ${fmt(endDate)}`
    return 'Select date range'
  }, [presets, startDate, endDate])

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full sm:w-auto ${className ?? ''}`}
    >
      <Button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full sm:w-auto"
      >
        <span className="truncate">{triggerLabel}</span>
        <span className="ml-2 text-gray-500">▾</span>
      </Button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-full max-w-[90vw] overflow-auto rounded-md border bg-white p-3 shadow-lg sm:left-auto sm:right-0 sm:w-80">
          {presets.length > 0 && (
            <div className="mb-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Presets
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {presets.map((p) => (
                  <Button
                    key={p.label}
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => applyPreset(p)}
                    className="justify-start"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="my-2 h-px bg-gray-200" />

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Custom range
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-sm text-gray-700">
                  Start
                </label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-sm text-gray-700">End</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={applyCustom}
                    className="w-full sm:w-auto"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateRangeFilter
