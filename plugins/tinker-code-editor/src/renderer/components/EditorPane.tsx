import { Editor } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import fileUrl from 'licia/fileUrl'
import type { editor } from 'monaco-editor'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { createPlayer } from '@videojs/react'
import { Video, videoFeatures } from '@videojs/react/video'
import VideoPlayer from 'share/components/VideoPlayer'
import { tw } from 'share/theme'
import store from '../store'
import { getLanguage } from 'share/lib/fileType'
import { getMonacoApi, initMonacoApi } from 'share/lib/monaco'
import { useBlameDecorations } from 'share/hooks/useBlameDecorations'
import { formatRelativeDate, formatTimeAgo } from 'share/lib/util'
import ImageViewer from 'share/components/ImageViewer'
import MarkdownPreview from 'share/components/MarkdownPreview'
import GitDiffPane from './GitDiffPane'

const { Container, Provider } = createPlayer({ features: videoFeatures })

initMonacoApi()

interface EditorPaneProps {
  tabId: string
}

export default observer(function EditorPane({ tabId }: EditorPaneProps) {
  const { i18n, t } = useTranslation()
  const tab = store.tabs.find((t) => t.id === tabId)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const blameAnnotations = useMemo(
    () =>
      (tab?.blameLineAnnotations ?? []).map((annotation) => {
        if (!annotation.isLeader || !annotation.dateMs) {
          return { ...annotation, date: '', dateTitle: undefined }
        }

        const { title } = formatRelativeDate(annotation.dateMs, i18n.language)

        return {
          lineNumber: annotation.lineNumber,
          isLeader: annotation.isLeader,
          sha: annotation.sha,
          text: annotation.text,
          date: formatTimeAgo(annotation.dateMs, i18n.language, 'narrow'),
          dateTitle: title,
        }
      }),
    [tab?.blameLineAnnotations, i18n.language]
  )

  useEffect(() => {
    return () => store.unregisterEditor(tabId)
  }, [tabId])

  const handleHighlightClick = useCallback((sha: string) => {
    store.setHighlightedBlameSha(sha)
  }, [])

  useBlameDecorations({
    editorRef,
    monacoApi: getMonacoApi(),
    annotations: blameAnnotations,
    highlightedSha: tab?.highlightedBlameSha ?? null,
    showBlame: (tab?.showingBlame ?? false) && tab?.id === store.activeTabId,
    onHighlightClick: handleHighlightClick,
  })

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['editor', 'preview'],
    id: 'tinker-code-editor-markdown-layout',
    storage: localStorage,
  })

  const showingMarkdownPreview = tab?.showingMarkdownPreview ?? false
  const markdownScrollPercent = tab?.markdownScrollPercent ?? 0

  const handleScrollPercentChange = useCallback(
    (percent: number) => {
      store.setMarkdownScrollPercent(tabId, percent)
    },
    [tabId]
  )

  useEffect(() => {
    if (!showingMarkdownPreview) return

    const instance = editorRef.current
    if (!instance) return

    const scrollHeight = instance.getScrollHeight()
    const visibleHeight = instance.getLayoutInfo().height
    const maxScroll = scrollHeight - visibleHeight
    if (maxScroll <= 0) return

    const currentPercent = instance.getScrollTop() / maxScroll
    if (Math.abs(currentPercent - markdownScrollPercent) > 0.001) {
      instance.setScrollTop(maxScroll * markdownScrollPercent)
    }
  }, [markdownScrollPercent, showingMarkdownPreview])

  if (!tab) return null

  if (tab.category === 'gitDiff') {
    return <GitDiffPane tabId={tabId} />
  }

  if (tab.category === 'image') {
    return (
      <div className="w-full h-full">
        <ImageViewer src={fileUrl(tab.filePath)} />
      </div>
    )
  }

  if (tab.category === 'video') {
    return (
      <div className="w-full h-full overflow-hidden">
        <Provider>
          <Container className="h-full">
            <VideoPlayer>
              <Video src={fileUrl(tab.filePath)} />
            </VideoPlayer>
          </Container>
        </Provider>
      </div>
    )
  }

  if (tab.category === 'binary') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className={`text-sm max-w-md text-center ${tw.text.secondary}`}>
          {t('binaryNotDisplayed')}
        </p>
        <button
          className={`px-3 py-1 text-sm rounded ${tw.primary.bg} text-white hover:opacity-90 transition-opacity`}
          onClick={() => store.forceOpenBinaryAsText(tabId)}
        >
          {t('openAnyway')}
        </button>
      </div>
    )
  }

  const handleChange = (value: string | undefined) => {
    if (tab.showingBlame) return
    store.updateContent(tabId, value || '')
  }

  const handleMount = (instance: editor.IStandaloneCodeEditor) => {
    editorRef.current = instance
    store.registerEditor(tabId, instance)
    const updateCursor = () => {
      const position = instance.getPosition()
      if (position) {
        store.setCursor(position.lineNumber, position.column)
      }
    }
    instance.onDidChangeCursorPosition(updateCursor)
    instance.onDidFocusEditorWidget(updateCursor)

    instance.onDidScrollChange((e) => {
      const currentTab = store.tabs.find((item) => item.id === tabId)
      if (!currentTab?.showingMarkdownPreview) return

      const scrollHeight = instance.getScrollHeight()
      const visibleHeight = instance.getLayoutInfo().height
      const maxScroll = scrollHeight - visibleHeight
      const scrollPercent = maxScroll > 0 ? e.scrollTop / maxScroll : 0

      if (Math.abs(currentTab.markdownScrollPercent - scrollPercent) > 0.001) {
        store.setMarkdownScrollPercent(tabId, scrollPercent)
      }
    })
  }

  const editorElement = (
    <Editor
      language={getLanguage(tab.filePath)}
      value={tab.content}
      onChange={handleChange}
      onMount={handleMount}
      theme={store.isDark ? 'vs-dark' : 'vs-light'}
      options={{
        readOnly: tab.showingBlame,
        minimap: { enabled: !tab.showingBlame },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'off',
        renderWhitespace: 'selection',
        ...(tab.showingBlame
          ? {
              guides: { indentation: false },
              occurrencesHighlight: 'off',
              glyphMargin: false,
            }
          : {}),
      }}
    />
  )

  if (tab.showingMarkdownPreview) {
    return (
      <Group
        orientation="horizontal"
        className="h-full"
        defaultLayout={defaultLayout}
        onLayoutChange={onLayoutChange}
      >
        <Panel id="editor" minSize={20}>
          <div className="h-full">{editorElement}</div>
        </Panel>
        <Separator />
        <Panel id="preview" minSize={20}>
          <MarkdownPreview
            content={tab.content}
            isDark={store.isDark}
            scrollPercent={tab.markdownScrollPercent}
            onScrollPercentChange={handleScrollPercentChange}
          />
        </Panel>
      </Group>
    )
  }

  return editorElement
})
