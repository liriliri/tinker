import { observer } from 'mobx-react-lite'
import {
  AlignJustify,
  Copy,
  Clipboard,
  Eraser,
  FileText,
  Network,
  Undo,
  Redo,
  Check,
  FolderOpen,
  AlertCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import store from '../store'
import ExpandIcon from '../assets/expand.svg?react'
import CollapseIcon from '../assets/collapse.svg?react'
import MinifyIcon from '../assets/minify.svg?react'

export default observer(function Toolbar() {
  const { t } = useTranslation()
  const { copied, copyToClipboard } = useCopyToClipboard()

  const handleCopy = async () => {
    await store.copyToClipboard()
    await copyToClipboard('') // Trigger the copied state
  }

  return (
    <Toolbar>
      <ToolbarButton
        variant="toggle"
        active={store.mode === 'text'}
        onClick={() => store.setMode('text')}
        title={t('textMode')}
      >
        <FileText size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        variant="toggle"
        active={store.mode === 'tree'}
        onClick={() => store.setMode('tree')}
        title={t('treeMode')}
      >
        <Network size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => store.undo()}
        disabled={!store.canUndo}
        title={t('undo')}
      >
        <Undo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.redo()}
        disabled={!store.canRedo}
        title={t('redo')}
      >
        <Redo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      {store.mode === 'text' ? (
        <>
          <ToolbarButton
            onClick={() => store.formatJson()}
            disabled={store.isEmpty}
            title={t('format')}
          >
            <AlignJustify size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => store.minifyJson()}
            disabled={store.isEmpty}
            title={t('minify')}
          >
            <MinifyIcon
              width={TOOLBAR_ICON_SIZE}
              height={TOOLBAR_ICON_SIZE}
              className="fill-current"
            />
          </ToolbarButton>
        </>
      ) : (
        <>
          <ToolbarButton
            onClick={() => store.expandAll()}
            disabled={store.isEmpty}
            title={t('expandAll')}
          >
            <ExpandIcon
              width={TOOLBAR_ICON_SIZE}
              height={TOOLBAR_ICON_SIZE}
              className="fill-current"
            />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => store.collapseAll()}
            disabled={store.isEmpty}
            title={t('collapseAll')}
          >
            <CollapseIcon
              width={TOOLBAR_ICON_SIZE}
              height={TOOLBAR_ICON_SIZE}
              className="fill-current"
            />
          </ToolbarButton>
        </>
      )}

      <ToolbarSeparator />

      <ToolbarButton
        onClick={handleCopy}
        disabled={store.isEmpty}
        className={copied ? 'text-[#0fc25e]' : ''}
        title={t('copy')}
      >
        {copied ? (
          <Check size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Copy size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.pasteFromClipboard()}
        title={t('paste')}
      >
        <Clipboard size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton onClick={() => store.openFile()} title={t('openFile')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.clearJson()}
        disabled={store.isEmpty}
        title={t('clear')}
      >
        <Eraser size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      {store.jsonError && (
        <div
          className="text-red-600 dark:text-red-400 ml-1"
          title={store.jsonError}
        >
          <AlertCircle size={16} />
        </div>
      )}

      <ToolbarSpacer />

      {store.lineCount > 0 && (
        <div className="text-gray-600 dark:text-gray-400 text-xs mr-1 whitespace-nowrap">
          {t('lines', { count: store.lineCount })}
        </div>
      )}
    </Toolbar>
  )
})
