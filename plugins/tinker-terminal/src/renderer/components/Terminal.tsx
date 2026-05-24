import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const THEME_BG = '#1a1b26'

export default function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: THEME_BG,
        foreground: '#c0caf5',
        cursor: '#c0caf5',
      },
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    xterm.loadAddon(fitAddon)
    xterm.open(containerRef.current)

    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    // Fit after a frame to ensure DOM is ready
    requestAnimationFrame(() => {
      fitAddon.fit()

      // Create pty with terminal dimensions
      terminal.create(xterm.cols, xterm.rows)
    })

    // Connect pty data to xterm
    terminal.onData((data: string) => {
      xterm.write(data)
    })

    terminal.onClose(() => {
      xterm.writeln('\r\n[Process exited]')
    })

    // Send user input to pty
    const inputDisposable = xterm.onData((data) => {
      terminal.write(data)
    })

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (fitAddonRef.current && xtermRef.current) {
          fitAddonRef.current.fit()
          terminal.resize(xtermRef.current.cols, xtermRef.current.rows)
        }
      })
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      inputDisposable.dispose()
      resizeObserver.disconnect()
      terminal.destroy()
      xterm.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={{ backgroundColor: THEME_BG }}
    />
  )
}
