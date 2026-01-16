import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Checkbox from 'share/components/Checkbox'
import Select from 'share/components/Select'
import store from '../store'
import { getTemplatesByPhotoCount } from '../lib/templates'

const PHOTO_COUNTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

const Sidebar = observer(() => {
  const { t } = useTranslation()

  const handleSelectTemplate = (templateId: string, areas: string[]) => {
    store.setTemplate(templateId, areas)
  }

  return (
    <div
      className={`w-60 ${tw.bg.both.tertiary} border-r ${tw.border.both} flex flex-col`}
    >
      <div className={`p-4 border-b ${tw.border.both} space-y-4`}>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm ${tw.text.both.primary}`}>
              {t('padding')}
            </label>
            <input
              type="number"
              value={store.padding}
              onChange={(e) => store.setPadding(Number(e.target.value))}
              className={`w-16 px-2 py-1 text-sm text-right ${tw.bg.both.secondary} ${tw.text.both.primary} border ${tw.border.both} rounded`}
              min={0}
              max={100}
            />
            <span className={`text-sm ${tw.text.both.secondary} ml-2`}>px</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={store.padding}
            onChange={(e) => store.setPadding(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm ${tw.text.both.primary}`}>
              {t('spacing')}
            </label>
            <input
              type="number"
              value={store.spacing}
              onChange={(e) => store.setSpacing(Number(e.target.value))}
              className={`w-16 px-2 py-1 text-sm text-right ${tw.bg.both.secondary} ${tw.text.both.primary} border ${tw.border.both} rounded`}
              min={0}
              max={100}
            />
            <span className={`text-sm ${tw.text.both.secondary} ml-2`}>px</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={store.spacing}
            onChange={(e) => store.setSpacing(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm ${tw.text.both.primary}`}>
              {t('radius')}
            </label>
            <Checkbox
              checked={store.radiusEnabled}
              onChange={() => store.toggleRadius()}
            />
            <input
              type="number"
              value={store.radius}
              onChange={(e) => store.setRadius(Number(e.target.value))}
              className={`w-16 px-2 py-1 text-sm text-right ${tw.bg.both.secondary} ${tw.text.both.primary} border ${tw.border.both} rounded`}
              min={0}
              max={100}
              disabled={!store.radiusEnabled}
            />
            <span className={`text-sm ${tw.text.both.secondary} ml-2`}>px</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={store.radius}
            onChange={(e) => store.setRadius(Number(e.target.value))}
            className="w-full"
            disabled={!store.radiusEnabled}
          />
        </div>
      </div>

      <div className={`p-4 border-b ${tw.border.both}`}>
        <Select
          value={store.selectedPhotoCount}
          onChange={(value) => store.setSelectedPhotoCount(value)}
          options={PHOTO_COUNTS.map((count) => ({
            label: `${count} ${t('photos')}`,
            value: count,
          }))}
          className="w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {getTemplatesByPhotoCount(store.selectedPhotoCount).map(
              (template) => (
                <button
                  key={template.id}
                  className={`aspect-square rounded ${
                    tw.bg.both.secondary
                  } hover:opacity-80 transition-opacity overflow-hidden ${
                    store.selectedTemplateId === template.id
                      ? `ring-2 ${tw.primary.ring}`
                      : ''
                  }`}
                  onClick={() =>
                    handleSelectTemplate(template.id, template.areas)
                  }
                >
                  <div
                    className="w-full h-full"
                    style={{
                      display: 'grid',
                      gridTemplate: template.gridTemplate,
                      gridTemplateAreas: template.gridAreas,
                      gap: '2px',
                      padding: '4px',
                    }}
                  >
                    {template.areas.map((area) => (
                      <div
                        key={area}
                        className={`${tw.bg.both.primary} border ${tw.border.both}`}
                        style={{ gridArea: area }}
                      />
                    ))}
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default Sidebar
