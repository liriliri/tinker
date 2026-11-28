import { observer } from 'mobx-react-lite'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import map from 'licia/map'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import Select from 'share/components/Select'
import { tw } from 'share/theme'
import store from '../store'
import type { EditorSectionId } from '../types'
import AiGenerate from './AiGenerate'
import BackgroundAdjustments from './BackgroundAdjustments'
import EditorSection from './EditorSection'
import IconAdjustments from './IconAdjustments'
import ShadowAdjustments from './ShadowAdjustments'
import ShapeAdjustments from './ShapeAdjustments'
import SourceSlot from './SourceSlot'

const EDITOR_SECTIONS: {
  id: EditorSectionId
  titleKey: string
  Content: ComponentType
}[] = [
  { id: 'icon', titleKey: 'iconSettings', Content: IconAdjustments },
  { id: 'shadow', titleKey: 'shadow', Content: ShadowAdjustments },
  { id: 'background', titleKey: 'background', Content: BackgroundAdjustments },
  { id: 'shape', titleKey: 'shape', Content: ShapeAdjustments },
]

const EditorPanel = observer(function EditorPanel() {
  const { t } = useTranslation()

  return (
    <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
      <div className={`shrink-0 space-y-3 border-b px-4 py-3 ${tw.border}`}>
        <Select
          className="w-full"
          value={store.presetSelectValue}
          options={store.presetOptions}
          onChange={(id) => {
            if (id === 'custom') return
            store.applyPreset(id)
          }}
        />
        <SourceSlot />
        <AiGenerate />
      </div>

      <OverlayScrollbars defer className="min-h-0 flex-1">
        <div className="pb-1">
          {map(EDITOR_SECTIONS, ({ id, titleKey, Content }) => (
            <EditorSection key={id} sectionId={id} title={t(titleKey)}>
              <Content />
            </EditorSection>
          ))}
        </div>
      </OverlayScrollbars>
    </div>
  )
})

export default EditorPanel
