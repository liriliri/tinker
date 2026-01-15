import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { getTemplatesByPhotoCount } from '../lib/templates'

const PHOTO_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

const TemplateSelector = observer(() => {
  const { t } = useTranslation()

  const handleSelectTemplate = (templateId: string, areas: string[]) => {
    store.setTemplate(templateId, areas)
  }

  return (
    <div
      className={`w-60 ${tw.bg.both.primary} ${tw.border.both.right} overflow-y-auto flex flex-col`}
    >
      {PHOTO_COUNTS.map((count) => {
        const templates = getTemplatesByPhotoCount(count)
        if (templates.length === 0) return null

        return (
          <div key={count} className={`p-4 ${tw.border.both.bottom}`}>
            <h3
              className={`text-xs font-semibold ${tw.text.both.secondary} mb-3`}
            >
              {count} {t('photos')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
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
                        className={`${tw.bg.both.primary} ${tw.border.both.full}`}
                        style={{ gridArea: area }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
})

export default TemplateSelector
