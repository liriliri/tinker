import { observer } from 'mobx-react-lite'
import store from '../store'
import PieMenuView from './PieMenuView'

export interface FloatingPieProps {
  onClose: () => void
  dismissOnAction: boolean
  draggable: boolean
}

export default observer(function FloatingPie({
  onClose,
  dismissOnAction,
  draggable,
}: FloatingPieProps) {
  async function handleSelect(index: number) {
    const action = store.slots[index]
    if (!action || !action.enabled) {
      if (dismissOnAction) onClose()
      return
    }
    await store.runSlot(index)
    if (dismissOnAction) onClose()
  }

  return (
    <div
      className="h-screen w-screen flex items-center justify-center bg-transparent"
      onMouseDown={(e) => {
        if (dismissOnAction && e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <PieMenuView
        slots={store.slots}
        onSelectSlot={(index) => void handleSelect(index)}
        onCenterClick={dismissOnAction ? onClose : undefined}
        centerDraggable={draggable}
        size={280}
      />
    </div>
  )
})
