import { forwardRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import Webview, { WebviewHandle } from 'share/components/Webview'
import { tw } from 'share/theme'
import store from '../store'

interface Props {
  resizing?: boolean
}

const BORDER_CLASS = {
  right: `border-l ${tw.border}`,
  left: `border-r ${tw.border}`,
  top: `border-b ${tw.border}`,
  bottom: `border-t ${tw.border}`,
}

const Preview = observer(
  forwardRef<WebviewHandle, Props>(function Preview({ resizing }, ref) {
    const handleInspectElement = useCallback(() => {
      store.openDevTools()
    }, [])

    return (
      <div className={`h-full relative ${BORDER_CLASS[store.layout]}`}>
        {store.previewUrl && (
          <Webview
            ref={ref}
            src={store.previewUrl}
            className="h-full"
            devTools={store.devTools}
            devToolsPosition={store.devToolsPosition}
            contextMenu={{
              openInNewTab: true,
              saveImage: true,
              saveAs: true,
              print: true,
              navigation: false,
              viewSource: false,
              inspect: true,
            }}
            onInspectElement={handleInspectElement}
            onDevToolsPositionChange={(pos) => store.setDevToolsPosition(pos)}
            onDevToolsClose={() => store.closeDevTools()}
          />
        )}
        {resizing && (
          <div className="absolute inset-0" style={{ zIndex: 10 }} />
        )}
      </div>
    )
  })
)

export default Preview
