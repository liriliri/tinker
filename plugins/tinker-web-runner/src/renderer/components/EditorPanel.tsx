import { observer } from 'mobx-react-lite'
import { Editor, OnMount } from '@monaco-editor/react'
import { Clipboard, Eraser } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarLabel,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import CopyButton from 'share/components/CopyButton'
import { tw } from 'share/theme'
import store from '../store'

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
}

interface Props {
  language: 'html' | 'css' | 'javascript'
  label: string
  value: string
  cursor: { line: number; col: number }
  onChange: (val: string) => void
  onMount: OnMount
  borderTop?: boolean
  borderLeft?: boolean
}

const EditorPanel = observer(function EditorPanel({
  language,
  label,
  value,
  cursor,
  onChange,
  onMount,
  borderTop,
  borderLeft,
}: Props) {
  const { t } = useTranslation()

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText()
    onChange(value + text)
  }

  return (
    <div
      className={`h-full flex flex-col overflow-hidden ${
        borderTop ? `border-t ${tw.border}` : ''
      } ${borderLeft ? `border-l ${tw.border}` : ''}`}
    >
      <Toolbar>
        <ToolbarLabel>{label}</ToolbarLabel>
        <ToolbarSeparator />
        <CopyButton
          variant="toolbar"
          text={value}
          disabled={!value}
          title={t('copy')}
        />
        <ToolbarButton onClick={handlePaste} title={t('paste')}>
          <Clipboard size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => onChange('')}
          disabled={!value}
          title={t('clear')}
        >
          <Eraser size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarSpacer />
        <span className={`text-xs ${tw.text.secondary}`}>
          {t('cursor', { line: cursor.line, col: cursor.col })}
        </span>
      </Toolbar>
      <div className="flex-1 overflow-hidden">
        <Editor
          language={language}
          value={value}
          onChange={(val) => onChange(val || '')}
          onMount={onMount}
          theme={store.isDark ? 'vs-dark' : 'vs-light'}
          options={EDITOR_OPTIONS}
        />
      </div>
    </div>
  )
})

export default EditorPanel
