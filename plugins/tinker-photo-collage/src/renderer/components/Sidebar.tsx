import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import className from 'licia/className'
import Select from 'share/components/Select'
import Slider from 'share/components/Slider'
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
            <span className={`text-sm ${tw.text.both.secondary}`}>
              {store.padding}px
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            value={store.padding}
            onChange={(value) => store.setPadding(value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm ${tw.text.both.primary}`}>
              {t('spacing')}
            </label>
            <span className={`text-sm ${tw.text.both.secondary}`}>
              {store.spacing}px
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            value={store.spacing}
            onChange={(value) => store.setSpacing(value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm ${tw.text.both.primary}`}>
              {t('radius')}
            </label>
            <span className={`text-sm ${tw.text.both.secondary}`}>
              {store.radius}px
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            value={store.radius}
            onChange={(value) => store.setRadius(value)}
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
                  className={className(
                    'aspect-square rounded border-2 hover:opacity-80 transition-all overflow-hidden',
                    tw.bg.both.secondary,
                    store.selectedTemplateId === template.id
                      ? tw.primary.border
                      : 'border-transparent'
                  )}
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
                      gap: '4px',
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
