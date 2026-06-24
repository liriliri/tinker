import { observer } from 'mobx-react-lite'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import AdjustSection from './AdjustSection'
import BasicAdjustments from './BasicAdjustments'
import ColorAdjustments from './ColorAdjustments'
import ColorMixerAdjustments from './ColorMixerAdjustments'
import CurveAdjustments from './CurveAdjustments'
import DetailsAdjustments from './DetailsAdjustments'
import EffectsAdjustments from './EffectsAdjustments'
import type { AdjustSectionId } from '../types/adjustSections'

const ADJUST_SECTIONS: {
  id: AdjustSectionId
  titleKey: string
  Content: ComponentType
}[] = [
  { id: 'basic', titleKey: 'basic', Content: BasicAdjustments },
  { id: 'curves', titleKey: 'curves', Content: CurveAdjustments },
  { id: 'color', titleKey: 'color', Content: ColorAdjustments },
  { id: 'colorMixer', titleKey: 'colorMixer', Content: ColorMixerAdjustments },
  { id: 'effects', titleKey: 'effects', Content: EffectsAdjustments },
  { id: 'details', titleKey: 'details', Content: DetailsAdjustments },
]

const AdjustPanel = observer(function AdjustPanel() {
  const { t } = useTranslation()

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <OverlayScrollbars defer className="min-h-0 flex-1">
        <div className="pb-1">
          {ADJUST_SECTIONS.map(({ id, titleKey, Content }) => (
            <AdjustSection key={id} sectionId={id} title={t(titleKey)}>
              <Content />
            </AdjustSection>
          ))}
        </div>
      </OverlayScrollbars>
    </div>
  )
})

export default AdjustPanel
