import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import range from 'licia/range'
import Slider from 'share/components/Slider'
import { tw } from 'share/theme'
import store from '../store'
import { SPLIT_PRESETS } from '../lib/presets'
import SplitPreviewList from './SplitPreviewList'

const GRID_MIN = 1
const GRID_MAX = 16

const Sidebar = observer(function Sidebar() {
  const { t } = useTranslation()

  const handlePresetClick = (presetId: string) => {
    store.applyPreset(presetId)
  }

  return (
    <div
      className={`w-60 ${tw.bg.tertiary} border-r ${tw.border} flex flex-col`}
    >
      <div className={`p-4 border-b ${tw.border} space-y-4`}>
        <div className="grid grid-cols-3 gap-2">
          {SPLIT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={className(
                'aspect-square rounded border-2 hover:opacity-80 transition-all overflow-hidden p-1',
                tw.bg.secondary,
                store.selectedPresetId === preset.id
                  ? tw.primary.border
                  : 'border-transparent'
              )}
              title={t(`preset${preset.id}`)}
              onClick={() => handlePresetClick(preset.id)}
            >
              <div
                className="w-full h-full"
                style={{
                  display: 'grid',
                  gridTemplateRows: `repeat(${preset.rows}, 1fr)`,
                  gridTemplateColumns: `repeat(${preset.cols}, 1fr)`,
                  gap: '2px',
                }}
              >
                {range(preset.rows * preset.cols).map((index) => (
                  <div
                    key={index}
                    className={`${tw.bg.primary} border ${tw.border}`}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm ${tw.text.primary}`}>{t('rows')}</label>
            <span className={`text-sm ${tw.text.secondary}`}>{store.rows}</span>
          </div>
          <Slider
            min={GRID_MIN}
            max={GRID_MAX}
            value={store.rows}
            onChange={(value) => store.setGrid(value, store.cols)}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm ${tw.text.primary}`}>{t('cols')}</label>
            <span className={`text-sm ${tw.text.secondary}`}>{store.cols}</span>
          </div>
          <Slider
            min={GRID_MIN}
            max={GRID_MAX}
            value={store.cols}
            onChange={(value) => store.setGrid(store.rows, value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <SplitPreviewList />
      </div>
    </div>
  )
})

export default Sidebar
