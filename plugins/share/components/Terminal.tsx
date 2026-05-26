import type { MenuItemConstructorOptions } from 'electron'
import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useTranslation } from 'react-i18next'
import { tw, THEME_COLORS } from '../theme'
import { addI18nNamespace } from '../lib/i18n'

const I18N_NS = 'terminal'

addI18nNamespace(I18N_NS, {
  'en-US': {
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select All',
  },
  'zh-CN': {
    copy: '复制',
    paste: '粘贴',
    selectAll: '全选',
  },
})

export interface TerminalApi {
  write(id: string, data: string): void
  resize(id: string, cols: number, rows: number): void
  onData(id: string, cb: (data: string) => void): void
  onClose(id: string, cb: () => void): void
  onInput(id: string, cb: () => void): void
  getProcessName(id: string): string
  getCwd(id: string): Promise<string>
}

export interface TerminalProps {
  id: string
  api: TerminalApi
  isDark: boolean
  onInit?: (id: string, cols: number, rows: number) => void
  onTitleChange?: (id: string, title: string) => void
  onFocus?: () => void
  extraContextMenuItems?: () => MenuItemConstructorOptions[]
}

interface TerminalInstance {
  element: HTMLDivElement
  xterm: XTerm
  fitAddon: FitAddon
  resizeObserver: ResizeObserver
  inputDisposable: { dispose: () => void }
}

const instances = new Map<string, TerminalInstance>()

export function destroyTerminal(
  id: string,
  api: { destroy(id: string): void }
) {
  api.destroy(id)
  const instance = instances.get(id)
  if (instance) {
    instance.inputDisposable.dispose()
    instance.resizeObserver.disconnect()
    instance.xterm.dispose()
    instances.delete(id)
  }
}

function getOrCreateInstance(
  id: string,
  api: TerminalApi,
  isDark: boolean,
  onInit?: (id: string, cols: number, rows: number) => void,
  onTitleChange?: (id: string, title: string) => void
): TerminalInstance {
  const existing = instances.get(id)
  if (existing) return existing

  const bg = isDark
    ? THEME_COLORS.bg.dark.primary
    : THEME_COLORS.bg.light.primary
  const fg = isDark
    ? THEME_COLORS.text.dark.primary
    : THEME_COLORS.text.light.primary

  const element = document.createElement('div')
  element.className = 'h-full w-full overflow-hidden'
  element.style.backgroundColor = bg

  const xterm = new XTerm({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: {
      background: bg,
      foreground: fg,
      cursor: fg,
    },
    allowProposedApi: true,
  })

  const fitAddon = new FitAddon()
  xterm.loadAddon(fitAddon)
  xterm.open(element)

  const inputDisposable = xterm.onData((data) => {
    api.write(id, data)
  })

  const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(() => {
      if (element.offsetWidth > 0 && element.offsetHeight > 0) {
        fitAddon.fit()
        api.resize(id, xterm.cols, xterm.rows)
      }
    })
  })
  resizeObserver.observe(element)

  requestAnimationFrame(() => {
    fitAddon.fit()

    if (onInit) {
      onInit(id, xterm.cols, xterm.rows)
    }

    let titleTimer: ReturnType<typeof setTimeout> | null = null
    let lastTitle = ''
    const updateTitle = () => {
      if (!onTitleChange) return
      if (titleTimer) clearTimeout(titleTimer)
      titleTimer = setTimeout(async () => {
        const name = api.getProcessName(id)
        if (name) {
          const cwd = await api.getCwd(id)
          const title = cwd ? `${cwd}:${name}` : name
          if (title !== lastTitle) {
            lastTitle = title
            onTitleChange(id, title)
          }
        }
      }, 300)
    }

    api.onData(id, (data: string) => {
      xterm.write(data)
      updateTitle()
    })

    api.onClose(id, () => {
      xterm.writeln('\r\n[Process exited]')
    })

    api.onInput(id, updateTitle)
    updateTitle()
  })

  const instance: TerminalInstance = {
    element,
    xterm,
    fitAddon,
    resizeObserver,
    inputDisposable,
  }
  instances.set(id, instance)
  return instance
}

export default function Terminal({
  id,
  api,
  isDark,
  onInit,
  onTitleChange,
  onFocus,
  extraContextMenuItems,
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation(I18N_NS)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const instance = getOrCreateInstance(id, api, isDark, onInit, onTitleChange)
    container.appendChild(instance.element)

    requestAnimationFrame(() => {
      instance.fitAddon.fit()
    })

    return () => {
      if (instance.element.parentElement === container) {
        container.removeChild(instance.element)
      }
    }
  }, [id])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const instance = instances.get(id)
      if (!instance) return
      const xterm = instance.xterm

      const items: MenuItemConstructorOptions[] = [
        {
          label: t('copy'),
          enabled: xterm.hasSelection(),
          click: () => {
            navigator.clipboard.writeText(xterm.getSelection())
          },
        },
        {
          label: t('paste'),
          click: async () => {
            const text = await navigator.clipboard.readText()
            api.write(id, text)
          },
        },
        { type: 'separator' },
        {
          label: t('selectAll'),
          click: () => {
            xterm.selectAll()
          },
        },
      ]

      if (extraContextMenuItems) {
        items.push({ type: 'separator' }, ...extraContextMenuItems())
      }

      tinker.showContextMenu(e.clientX, e.clientY, items)
    },
    [id, t, api, extraContextMenuItems]
  )

  const handleFocus = useCallback(() => {
    onFocus?.()
  }, [onFocus])

  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-hidden ${tw.bg.primary}`}
      onContextMenu={handleContextMenu}
      onFocus={handleFocus}
      onMouseDown={handleFocus}
    />
  )
}
