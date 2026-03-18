import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import Dialog from 'share/components/Dialog'
import { THEME_COLORS } from 'share/theme'
import type { Account } from '../types'
import { buildOtpAuthUri } from '../lib/totp'
import { renderQRToCanvas } from '../lib/qr'
import store from '../store'

interface QRCanvasProps {
  account: Account
  isDark: boolean
}

function QRCanvas({ account, isDark }: QRCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const uri = buildOtpAuthUri(account)
    const fgColor = isDark
      ? THEME_COLORS.text.dark.primary
      : THEME_COLORS.text.light.primary
    const bgColor = isDark
      ? THEME_COLORS.bg.dark.primary
      : THEME_COLORS.bg.light.primary
    renderQRToCanvas(canvasRef.current, uri, 240, fgColor, bgColor)
  }, [account, isDark])

  return <canvas ref={canvasRef} className="rounded" />
}

export default observer(function QRDialog() {
  const account = store.qrAccount

  const title = account
    ? account.issuer
      ? `${account.issuer} (${account.account})`
      : account.account
    : ''

  return (
    <Dialog
      open={store.showQRDialog}
      onClose={() => store.closeQRDialog()}
      title={title}
      showClose
    >
      <div className="flex flex-col items-center gap-3">
        {account && <QRCanvas account={account} isDark={store.isDark} />}
      </div>
    </Dialog>
  )
})
