import type { MenuItemConstructorOptions } from 'electron'
import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useTranslation } from 'react-i18next'
import isWindows from 'licia/isWindows'
import { tw, THEME_COLORS } from '../theme'
import { addI18nNamespace } from '../lib/i18n'
import type { TerminalSession } from '../types/terminal'

function formatPathForShell(path: string): string {
  if (isWindows) {
    return /[\s&^()[\]{};!'+,=`~]/.test(path) ? `"${path}"` : path
  }
  if (/[^A-Za-z0-9_./:@%+\-,~]/.test(path)) {
    return `'${path.replace(/'/g, "'\\''")}'`
  }
  return path
}

function getPathsFromDataTransfer(dataTransfer: DataTransfer): string[] {
  const paths: string[] = []
  const { files } = dataTransfer
  for (let i = 0; i < files.length; i++) {
    const file = files[i] as File & { path?: string }
    if (file.path) paths.push(file.path)
  }
  return paths
}

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

export interface TerminalProps {
  id: string
  createSession: (cols: number, rows: number) => TerminalSession
  isDark: boolean
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
  session: TerminalSession
}

const instances = new Map<string, TerminalInstance>()

/** Look up an active session by pane id. Returns undefined if not yet mounted. */
export function getTerminalSession(id: string): TerminalSession | undefined {
  return instances.get(id)?.session
}

/** Get selected text from a terminal pane. Returns empty string if none. */
export function getTerminalSelection(id: string): string {
  return instances.get(id)?.xterm.getSelection() ?? ''
}

export function destroyTerminal(id: string) {
  const instance = instances.get(id)
  if (!instance) return
  instance.session.destroy()
  instance.inputDisposable.dispose()
  instance.resizeObserver.disconnect()
  instance.xterm.dispose()
  instances.delete(id)
}

function getOrCreateInstance(
  id: string,
  createSession: (cols: number, rows: number) => TerminalSession,
  isDark: boolean,
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

  // Defer session creation until xterm has fitted to its container so we
  // know the real cols/rows.
  const sessionRef: { current: TerminalSession | null } = { current: null }

  const inputDisposable = xterm.onData((data) => {
    sessionRef.current?.write(data)
  })

  const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(() => {
      if (element.offsetWidth > 0 && element.offsetHeight > 0) {
        fitAddon.fit()
        sessionRef.current?.resize(xterm.cols, xterm.rows)
      }
    })
  })
  resizeObserver.observe(element)

  const instance: TerminalInstance = {
    element,
    xterm,
    fitAddon,
    resizeObserver,
    inputDisposable,
    // Placeholder; will be replaced once we spawn the session below.
    session: {
      write() {},
      resize() {},
      destroy() {},
      onData() {},
      onClose() {},
      onInput() {},
      getInfo: () => Promise.resolve({ processName: '', cwd: '' }),
    },
  }
  instances.set(id, instance)

  requestAnimationFrame(() => {
    fitAddon.fit()

    const session = createSession(xterm.cols, xterm.rows)
    sessionRef.current = session
    instance.session = session

    let titleTimer: ReturnType<typeof setTimeout> | null = null
    let lastTitle = ''
    const updateTitle = () => {
      if (!onTitleChange) return
      if (titleTimer) clearTimeout(titleTimer)
      titleTimer = setTimeout(async () => {
        const { processName, cwd } = await session.getInfo()
        if (processName) {
          const cwdName = cwd.split(/[/\\]/).pop() || ''
          const title = cwdName ? `${cwdName}:${processName}` : processName
          if (title !== lastTitle) {
            lastTitle = title
            onTitleChange(id, title)
          }
        }
      }, 300)
    }

    session.onData((data: string) => {
      xterm.write(data)
      updateTitle()
    })

    session.onClose(() => {
      xterm.writeln('\r\n[Process exited]')
    })

    session.onInput(updateTitle)
    updateTitle()
  })

  return instance
}

export default function Terminal({
  id,
  createSession,
  isDark,
  onTitleChange,
  onFocus,
  extraContextMenuItems,
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation(I18N_NS)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const instance = getOrCreateInstance(
      id,
      createSession,
      isDark,
      onTitleChange
    )
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
            instance.session.write(text)
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
    [id, t, extraContextMenuItems]
  )

  const handleFocus = useCallback(() => {
    onFocus?.()
  }, [onFocus])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const paths = e.dataTransfer
        ? getPathsFromDataTransfer(e.dataTransfer)
        : []
      if (paths.length === 0) return

      const instance = instances.get(id)
      if (!instance) return

      const text = paths.map(formatPathForShell).join(' ')
      instance.session.write(text)
      instance.xterm.focus()
      onFocus?.()
    }

    container.addEventListener('dragover', handleDragOver)
    container.addEventListener('drop', handleDrop)

    return () => {
      container.removeEventListener('dragover', handleDragOver)
      container.removeEventListener('drop', handleDrop)
    }
  }, [id, onFocus])

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
