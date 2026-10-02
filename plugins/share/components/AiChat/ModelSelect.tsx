import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Search } from 'lucide-react'
import className from 'licia/className'
import contain from 'licia/contain'
import each from 'licia/each'
import filter from 'licia/filter'
import isEmpty from 'licia/isEmpty'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import trim from 'licia/trim'
import { tw } from '../../theme'
import { AI_CHAT_NS } from './i18n'

export interface ModelSelectOption {
  label: string
  value: string
}

export interface ModelSelectProps {
  value: string
  onChange: (value: string) => void
  options: ModelSelectOption[]
  disabled?: boolean
}

interface ParsedOption {
  value: string
  provider: string
  model: string
  vendor: string
  modelName: string
}

interface VendorGroup {
  vendor: string
  items: ParsedOption[]
}

interface ProviderGroup {
  provider: string
  vendors: VendorGroup[]
}

interface PanelPosition {
  left: number
  bottom: number
  width: number
}

const PANEL_WIDTH = 384
const LIST_HEIGHT = 288

function parseOption(option: ModelSelectOption): ParsedOption {
  const idx = option.value.indexOf(':')
  const provider = idx === -1 ? '' : option.value.slice(0, idx)
  const model = idx === -1 ? option.value : option.value.slice(idx + 1)
  const slash = model.indexOf('/')
  const hasVendor = slash > 0 && slash < model.length - 1
  return {
    value: option.value,
    provider,
    model,
    vendor: hasVendor ? model.slice(0, slash) : '',
    modelName: hasVendor ? model.slice(slash + 1) : model,
  }
}

function normalizeSearch(value: string): string {
  return lowerCase(value)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function compactSearch(value: string): string {
  return normalizeSearch(value).replace(/\s+/g, '')
}

function matchesSearch(query: string, values: string[]): boolean {
  const search = normalizeSearch(query)
  if (!search) return true
  const compact = compactSearch(query)
  return values.some((value) => {
    const normalized = normalizeSearch(value)
    return contain(normalized, search) || contain(compactSearch(value), compact)
  })
}

function groupByVendor(items: ParsedOption[]): VendorGroup[] {
  const withVendor = filter(items, (item) => !!item.vendor)
  const useVendor =
    !isEmpty(withVendor) && withVendor.length >= items.length * 0.5
  if (!useVendor) {
    return [{ vendor: '', items }]
  }

  const groups: VendorGroup[] = []
  const index = new Map<string, VendorGroup>()
  each(items, (item) => {
    const key = item.vendor || '_'
    let group = index.get(key)
    if (!group) {
      group = { vendor: item.vendor, items: [] }
      index.set(key, group)
      groups.push(group)
    }
    group.items.push(item)
  })
  return groups
}

function groupOptions(options: ParsedOption[]): ProviderGroup[] {
  const index = new Map<string, ParsedOption[]>()
  const order: string[] = []
  each(options, (item) => {
    const key = item.provider || ''
    let items = index.get(key)
    if (!items) {
      items = []
      index.set(key, items)
      order.push(key)
    }
    items.push(item)
  })
  return map(order, (provider) => ({
    provider,
    vendors: groupByVendor(index.get(provider) ?? []),
  }))
}

function getPanelPosition(trigger: HTMLElement): PanelPosition {
  const rect = trigger.getBoundingClientRect()
  const width = Math.min(PANEL_WIDTH, window.innerWidth - 24)
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12)
  return {
    left,
    bottom: window.innerHeight - rect.top + 4,
    width,
  }
}

export default function ModelSelect({
  value,
  onChange,
  options,
  disabled = false,
}: ModelSelectProps) {
  const { t } = useTranslation(AI_CHAT_NS)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [panelPos, setPanelPos] = useState<PanelPosition | null>(null)

  const parsed = useMemo(() => map(options, parseOption), [options])
  const selected = useMemo(
    () => parsed.find((opt) => opt.value === value) ?? null,
    [parsed, value]
  )

  const groups = useMemo(() => {
    const filtered = filter(parsed, (item) =>
      matchesSearch(query, [item.provider, item.model])
    )
    return groupOptions(filtered)
  }, [parsed, query])

  useEffect(() => {
    if (!open) {
      setPanelPos(null)
      return
    }
    setQuery('')

    const updatePosition = () => {
      if (!rootRef.current) return
      setPanelPos(getPanelPosition(rootRef.current))
    }
    updatePosition()

    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleSelect = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  const triggerTitle = selected
    ? selected.provider
      ? `${selected.provider} / ${selected.model}`
      : selected.model
    : ''

  const panel =
    open &&
    panelPos &&
    createPortal(
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          left: panelPos.left,
          bottom: panelPos.bottom,
          width: panelPos.width,
          zIndex: 9999,
        }}
        className={className(
          'flex flex-col overflow-hidden rounded-md border shadow-lg',
          tw.bg.secondary,
          tw.border
        )}
      >
        <div
          className={className(
            'flex items-center gap-2 border-b px-2.5 py-2',
            tw.bg.tertiary,
            tw.border
          )}
        >
          <Search size={14} className={tw.text.tertiary} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchModels')}
            className={className(
              'min-w-0 flex-1 border-none bg-transparent text-xs outline-none',
              tw.text.primary,
              'placeholder:text-gray-400 dark:placeholder:text-gray-500'
            )}
          />
        </div>

        <div
          className={className('overflow-y-auto', tw.bg.primary)}
          style={{ height: LIST_HEIGHT }}
        >
          {isEmpty(groups) ? (
            <div
              className={className(
                'flex h-full items-center justify-center px-3 text-xs',
                tw.text.tertiary
              )}
            >
              {trim(query) ? t('noMatchingModels') : t('noProviders')}
            </div>
          ) : (
            map(groups, (group) => (
              <div key={group.provider || '_'} className="pb-1">
                {group.provider && (
                  <div
                    className={className(
                      'sticky top-0 z-10 px-3 py-2 text-xs font-medium',
                      tw.bg.primary,
                      tw.text.tertiary
                    )}
                  >
                    {group.provider}
                  </div>
                )}
                {map(group.vendors, (vendorGroup) => (
                  <div key={`${group.provider}:${vendorGroup.vendor || '_'}`}>
                    {vendorGroup.vendor && (
                      <div
                        className={className(
                          'px-3 pb-0.5 pt-1.5 text-[11px]',
                          tw.text.tertiary
                        )}
                      >
                        {vendorGroup.vendor}
                      </div>
                    )}
                    {map(vendorGroup.items, (item) => {
                      const active = item.value === value
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleSelect(item.value)}
                          className={className(
                            'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs',
                            tw.text.primary,
                            tw.hover,
                            active && tw.primary.bgFocused
                          )}
                          title={item.value}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {item.modelName}
                          </span>
                          {active && (
                            <Check
                              size={13}
                              className={className('shrink-0', tw.primary.text)}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>,
      document.body
    )

  return (
    <div ref={rootRef} className="relative inline-flex min-w-0 max-w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          if (!open && rootRef.current) {
            setPanelPos(getPanelPosition(rootRef.current))
          }
          setOpen((prev) => !prev)
        }}
        className={className(
          'inline-flex h-8 min-w-0 max-w-full items-center gap-1.5 rounded-sm border-none px-2 text-xs font-medium',
          tw.text.secondary,
          !disabled && tw.hover,
          'disabled:cursor-not-allowed'
        )}
        title={triggerTitle}
      >
        {selected ? (
          <>
            {selected.provider && (
              <span
                className={className(
                  'max-w-[40%] shrink truncate rounded px-1.5 py-0.5 text-[10px] font-semibold',
                  tw.bg.secondary,
                  tw.text.tertiary
                )}
              >
                {selected.provider}
              </span>
            )}
            <span className={className('min-w-0 truncate', tw.text.primary)}>
              {selected.modelName}
            </span>
          </>
        ) : (
          <span className="min-w-0 truncate">{t('noProviders')}</span>
        )}
        <ChevronDown size={12} className="size-3 shrink-0" />
      </button>
      {panel}
    </div>
  )
}
