import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { X, FileText, Image as ImageIcon } from 'lucide-react'
import { ClipboardItem as ClipboardItemType } from '../../common/types'
import { tw } from 'share/theme'
import { formatRelativeTime } from '../lib/timeFormat'

interface ClipboardItemProps {
  item: ClipboardItemType
  onCopy: () => void
  onDelete: () => void
}

export default observer(function ClipboardItem({
  item,
  onCopy,
  onDelete,
}: ClipboardItemProps) {
  const { t } = useTranslation()

  const renderPreview = () => {
    switch (item.type) {
      case 'text':
        return (
          <div className={`flex-1 min-w-0`}>
            <div className="flex items-start gap-2">
              <FileText
                size={16}
                className={`mt-0.5 flex-shrink-0 ${tw.text.tertiary}`}
              />
              <div className="flex-1 min-w-0">
                <pre
                  className={`text-sm font-mono whitespace-pre-wrap break-all ${tw.text.primary}`}
                >
                  {item.preview || item.data}
                </pre>
              </div>
            </div>
          </div>
        )
      case 'image':
        return (
          <div className="flex items-center gap-3">
            <ImageIcon size={16} className={`${tw.text.tertiary}`} />
            <img
              src={item.data}
              alt="clipboard"
              className={`h-16 w-auto max-w-[200px] rounded border ${tw.border} object-contain`}
            />
          </div>
        )
      case 'file':
        return (
          <div className="flex items-start gap-2">
            <FileText size={16} className={`mt-0.5 ${tw.text.tertiary}`} />
            <span className={`text-sm ${tw.text.primary}`}>
              {item.preview || item.data}
            </span>
          </div>
        )
    }
  }

  return (
    <div
      className={`group px-4 py-3 border-b ${tw.border} ${tw.hover} transition-colors cursor-pointer`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0" onClick={onCopy}>
          {renderPreview()}
        </div>

        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className={`p-1.5 rounded transition-colors ${tw.hover} hover:bg-red-500/10 dark:hover:bg-red-500/20 group/delete`}
            title={t('delete')}
          >
            <X
              size={16}
              className={`${tw.text.tertiary} group-hover/delete:text-red-500 transition-colors`}
            />
          </button>
        </div>
      </div>

      <div className={`mt-2 text-xs ${tw.text.tertiary}`}>
        {formatRelativeTime(item.timestamp, t)}
      </div>
    </div>
  )
})
