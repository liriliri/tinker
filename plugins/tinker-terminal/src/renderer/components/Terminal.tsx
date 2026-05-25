import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { tw, THEME_COLORS } from 'share/theme'
import { useTranslation } from 'react-i18next'
import store from '../store'
import '@xterm/xterm/css/xterm.css'

function getBgColor() {
  return store.isDark
    ? THEME_COLORS.bg.dark.primary
    : THEME_COLORS.bg.light.primary
}

function getFgColor() {
  return store.isDark
    ? THEME_COLORS.text.dark.primary
    : THEME_COLORS.text.light.primary
}

// Persistent terminal instances that survive remounts
interface TerminalInstance {
  element: HTMLDivElement
  xterm: XTerm
  fitAddon: FitAddon
  resizeObserver: ResizeObserver
  inputDisposable: { dispose: () => void }
}

const instances = new Map<string, TerminalInstance>()

function destroyPane(paneId: string) {
  terminal.destroy(paneId)
  const instance = instances.get(paneId)
  if (instance) {
    instance.inputDisposable.dispose()
    instance.resizeObserver.disconnect()
    instance.xterm.dispose()
    instances.delete(paneId)
  }
}

function getOrCreateInstance(paneId: string): TerminalInstance {
  const existing = instances.get(paneId)
  if (existing) return existing

  const bg = getBgColor()
  const fg = getFgColor()

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
    terminal.write(paneId, data)
  })

  const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(() => {
      if (element.offsetWidth > 0 && element.offsetHeight > 0) {
        fitAddon.fit()
        terminal.resize(paneId, xterm.cols, xterm.rows)
      }
    })
  })
  resizeObserver.observe(element)

  requestAnimationFrame(() => {
    fitAddon.fit()
    const sshConfig = store.pendingSSHConfig[paneId]
    if (sshConfig) {
      delete store.pendingSSHConfig[paneId]
      terminal.createSSH(paneId, xterm.cols, xterm.rows, {
        host: sshConfig.host!,
        port: sshConfig.port || 22,
        username: sshConfig.username!,
        authType: sshConfig.authType || 'password',
        password: sshConfig.password,
        privateKey: sshConfig.privateKey,
      })

      terminal.onData(paneId, (data: string) => {
        xterm.write(data)
      })

      terminal.onClose(paneId, () => {
        xterm.writeln('\r\n[Connection closed]')
      })

      store.setPaneTitle(paneId, `${sshConfig.username}@${sshConfig.host}`)
    } else {
      const pendingCwd = store.pendingCwd[paneId]
      if (pendingCwd) {
        delete store.pendingCwd[paneId]
      }
      const pendingShell = store.pendingShell[paneId]
      if (pendingShell) {
        delete store.pendingShell[paneId]
      }
      terminal.create(paneId, xterm.cols, xterm.rows, pendingCwd, pendingShell)

      // Debounced title update - triggered by both input and output
      let titleTimer: ReturnType<typeof setTimeout> | null = null
      let lastTitle = ''
      const updateTitle = () => {
        if (titleTimer) clearTimeout(titleTimer)
        titleTimer = setTimeout(async () => {
          const name = terminal.getProcessName(paneId)
          if (name) {
            const cwd = await terminal.getCwd(paneId)
            const title = cwd ? `${cwd}:${name}` : name
            if (title !== lastTitle) {
              lastTitle = title
              store.setPaneTitle(paneId, title)
            }
          }
        }, 300)
      }

      terminal.onData(paneId, (data: string) => {
        xterm.write(data)
        updateTitle()
      })

      terminal.onClose(paneId, () => {
        xterm.writeln('\r\n[Process exited]')
      })

      terminal.onInput(paneId, updateTitle)

      // Initial title update
      const name = terminal.getProcessName(paneId)
      if (name) {
        terminal.getCwd(paneId).then((cwd) => {
          store.setPaneTitle(paneId, cwd ? `${cwd}:${name}` : name)
        })
      }
    }
  })

  const instance: TerminalInstance = {
    element,
    xterm,
    fitAddon,
    resizeObserver,
    inputDisposable,
  }
  instances.set(paneId, instance)
  return instance
}

interface TerminalProps {
  paneId: string
}

export default function Terminal({ paneId }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const instance = getOrCreateInstance(paneId)
    container.appendChild(instance.element)

    // Refit after reparent
    requestAnimationFrame(() => {
      instance.fitAddon.fit()
    })

    return () => {
      if (instance.element.parentElement === container) {
        container.removeChild(instance.element)
      }
    }
  }, [paneId])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const instance = instances.get(paneId)
      if (!instance) return
      const xterm = instance.xterm

      tinker.showContextMenu(e.clientX, e.clientY, [
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
            terminal.write(paneId, text)
          },
        },
        { type: 'separator' },
        {
          label: t('selectAll'),
          click: () => {
            xterm.selectAll()
          },
        },
        { type: 'separator' },
        {
          label: t('splitVertical'),
          click: () => store.splitPane(paneId, 'horizontal'),
        },
        {
          label: t('splitHorizontal'),
          click: () => store.splitPane(paneId, 'vertical'),
        },
        { type: 'separator' },
        {
          label: t('closePane'),
          click: () => store.closePane(paneId),
        },
      ])
    },
    [paneId, t]
  )

  const handleFocus = useCallback(() => {
    store.setActivePane(paneId)
  }, [paneId])

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

// Register destroyPane on store to avoid circular import
store.onDestroyPane = destroyPane
