import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import MindMap from 'simple-mind-map'
import MiniMap from 'simple-mind-map/src/plugins/MiniMap.js'
import Watermark from 'simple-mind-map/src/plugins/Watermark.js'
import KeyboardNavigation from 'simple-mind-map/src/plugins/KeyboardNavigation.js'
import Drag from 'simple-mind-map/src/plugins/Drag.js'
import Select from 'simple-mind-map/src/plugins/Select.js'
import Export from 'simple-mind-map/src/plugins/Export.js'
import store from '../store'

MindMap.usePlugin(MiniMap)
  .usePlugin(Watermark)
  .usePlugin(Drag)
  .usePlugin(KeyboardNavigation)
  .usePlugin(Export)
  .usePlugin(Select)

export default observer(function MindMapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const data = store.loadData()

    const mindMap = new MindMap({
      el: containerRef.current,
      data: data.root,
      layout: data.layout || store.currentLayout,
      theme: data.theme || store.currentTheme,
    } as any)

    store.setMindMap(mindMap)

    // Listen for node right-click events
    mindMap.on('node_contextmenu', (e: any, node: any) => {
      e.preventDefault()
      store.showNodeContextMenu(e, node)
    })

    const handleResize = () => {
      mindMap?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      mindMap?.destroy()
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
})
