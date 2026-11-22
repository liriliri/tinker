import { useEffect, useRef } from 'react'
import h from 'licia/h'
import LunaModal from 'luna-modal'
import LunaNotification from 'luna-notification'
import {
  IOverlayModalRequest,
  IOverlayModalResult,
  IOverlayNotifyOptions,
} from 'common/types'

const NOTIFY_DURATION = 2000

export default function OverlayApp() {
  const notificationRef = useRef<LunaNotification | null>(null)
  const pendingRef = useRef(0)

  useEffect(() => {
    document.body.style.backgroundColor = 'transparent'

    const offNotify = main.on(
      'overlay:notify',
      (content: string, options?: IOverlayNotifyOptions) => {
        if (!notificationRef.current) {
          const div = h('div')
          document.body.appendChild(div)
          notificationRef.current = new LunaNotification(div, {
            position: { x: 'center', y: 'top' },
          })
        }

        const duration = options?.duration ?? NOTIFY_DURATION
        notificationRef.current.notify(content, options)

        pendingRef.current += 1
        setTimeout(() => {
          pendingRef.current -= 1
          if (pendingRef.current <= 0) {
            pendingRef.current = 0
            main.overlayNotifyDone()
          }
        }, duration)
      }
    )

    const offModal = main.on(
      'overlay:modal',
      async (request: IOverlayModalRequest) => {
        let result: IOverlayModalResult = null
        switch (request.type) {
          case 'alert':
            await LunaModal.alert(request.message)
            break
          case 'confirm':
            result = await LunaModal.confirm(request.message)
            break
        }
        main.overlayModalResult(request.id, result)
      }
    )

    main.overlayReady()

    return () => {
      offNotify()
      offModal()
    }
  }, [])

  return null
}
