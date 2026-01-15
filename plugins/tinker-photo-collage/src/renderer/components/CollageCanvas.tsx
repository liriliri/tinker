import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import store from '../store'
import { getTemplateById } from '../lib/templates'
import PhotoSlot from './PhotoSlot'

const CollageCanvas = observer(() => {
  const template = getTemplateById(store.selectedTemplateId)

  if (!template) {
    return null
  }

  const canvasStyle = {
    display: 'grid',
    gridTemplate: template.gridTemplate,
    gridTemplateAreas: template.gridAreas,
    gap: `${store.spacing}px`,
    padding: `${store.padding}px`,
  }

  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden p-8">
      <div
        className={`${tw.bg.both.secondary} shadow-2xl w-full h-full`}
        style={canvasStyle}
      >
        {template.areas.map((area) => (
          <PhotoSlot key={area} areaName={area} />
        ))}
      </div>
    </div>
  )
})

export default CollageCanvas
