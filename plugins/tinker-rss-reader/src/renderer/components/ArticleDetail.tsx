import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, FileText, Loader2, X } from 'lucide-react'
import escape from 'licia/escape'
import { tw, THEME_COLORS } from 'share/theme'
import store from '../store'
import { sanitizeHtml } from '../lib/util'

const OVERLAY_STYLE: React.CSSProperties = {
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(4px)',
}
const PANEL_STYLE: React.CSSProperties = {
  width: '920px',
  maxWidth: '90vw',
  height: '86vh',
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString()
}

function buildIframeContent(
  title: string,
  thumb: string,
  bodyText: string,
  mutedText: string,
  codeBg: string,
  codeText: string,
  bgSecondary: string,
  borderColor: string,
  headingText: string,
  bgPrimary: string,
  content: string
): string {
  const titleHtml = escape(title)
  const thumbHtml = thumb
    ? `<img class="hero" src="${escape(thumb)}" alt="" />`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<style>
  * { box-sizing: border-box; }
  html { background: ${bgPrimary}; }
  body { background: ${bgPrimary}; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: ${bodyText};
    margin: 0;
    padding: 20px 72px 56px;
    word-wrap: break-word;
    overflow: hidden auto;
  }
  @media (max-width: 720px) {
    body { padding: 16px 20px 32px; font-size: 14px; }
  }
  a { color: ${THEME_COLORS.primary}; text-decoration: none; }
  a:hover { color: ${THEME_COLORS.primaryHover}; text-decoration: underline; }
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  #main {
    max-width: 700px;
    margin: 0 auto;
    animation: fadeIn 0.28s cubic-bezier(0.1, 0.9, 0.2, 1) both;
  }
  .title {
    color: ${headingText};
    font-size: 1.875rem;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 12px;
  }
  .hero {
    display: block;
    width: 100%;
    max-height: 320px;
    object-fit: cover;
    border-radius: 12px;
    margin: 0 0 24px;
    background: ${bgSecondary};
  }
  article {
    line-height: 1.72;
    font-size: 1rem;
  }
  article * { max-width: 100%; }
  article img, article video { height: auto; border-radius: 8px; }
  article p, article ul, article ol, article pre, article table, article figure {
    margin: 1em 0;
  }
  figure { text-align: center; }
  figcaption { font-size: 12px; color: ${mutedText}; margin-top: 8px; }
  blockquote {
    border-left: 2px solid ${mutedText};
    margin: 1em 0;
    padding: 0 0 0 20px;
    color: ${mutedText};
  }
  pre {
    background: ${codeBg};
    color: ${codeText};
    padding: 14px 16px;
    border-radius: 10px;
    white-space: pre-wrap;
    word-break: normal;
    overflow-wrap: normal;
    font-size: 13px;
    overflow-x: auto;
  }
  code {
    font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace;
    font-size: 0.875em;
    line-height: 1;
    background: ${bgSecondary};
    padding: 0.15em 0.35em;
    border-radius: 4px;
  }
  pre code {
    color: inherit;
    background: none;
    padding: 0;
    font-size: 1em;
    line-height: inherit;
  }
  h1, h2, h3, h4, h5, h6 {
    color: ${headingText};
    font-weight: 600;
    line-height: 1.35;
    margin: 1.5em 0 0.6em;
  }
  h1 { font-size: 1.5em; }
  h2 { font-size: 1.3em; }
  h3 { font-size: 1.15em; }
  ul, ol { padding-left: 1.5em; }
  li { margin: 0.4em 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid ${borderColor}; padding: 6px 10px; text-align: left; }
  th { background: ${bgSecondary}; font-weight: 600; }
  hr { border: none; border-top: 1px solid ${borderColor}; margin: 1.5em 0; }
  article iframe { width: 100%; }
</style>
</head>
<body>
  <main id="main">
    <h1 class="title">${titleHtml}</h1>
    ${thumbHtml}
    <article>${sanitizeHtml(content)}</article>
  </main>
</body>
</html>`
}

export default observer(function ArticleDetail() {
  const { t } = useTranslation()
  const item = store.selectedItem

  useEffect(() => {
    if (!item) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') store.closeArticle()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [item])

  if (!item) return null

  const source = store.sources.find((s) => s.id === item.sourceId)
  const isDark = store.isDark
  const bodyText = isDark
    ? THEME_COLORS.text.dark.primary
    : THEME_COLORS.text.light.primary
  const mutedText = isDark
    ? THEME_COLORS.text.dark.secondary
    : THEME_COLORS.text.light.secondary
  const codeBg = isDark
    ? THEME_COLORS.bg.dark.code
    : THEME_COLORS.gray.light[100]
  const codeText = isDark
    ? THEME_COLORS.text.dark.primary
    : THEME_COLORS.text.light.primary
  const bgSecondary = isDark
    ? THEME_COLORS.bg.dark.secondary
    : THEME_COLORS.bg.light.secondary
  const borderColor = isDark
    ? THEME_COLORS.border.dark
    : THEME_COLORS.border.light
  const headingText = isDark
    ? THEME_COLORS.text.dark.primary
    : THEME_COLORS.text.light.primary
  const bgPrimary = isDark
    ? THEME_COLORS.bg.dark.primary
    : THEME_COLORS.bg.light.primary

  const displayContent = store.fullContent ?? item.content

  const iframeContent = buildIframeContent(
    item.title,
    item.thumb,
    bodyText,
    mutedText,
    codeBg,
    codeText,
    bgSecondary,
    borderColor,
    headingText,
    bgPrimary,
    displayContent
  )

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={OVERLAY_STYLE}
      onClick={() => store.closeArticle()}
    >
      <div
        className={`flex flex-col rounded-lg shadow-2xl overflow-hidden border ${tw.bg.primary} ${tw.border}`}
        style={PANEL_STYLE}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`px-4 py-2 border-b ${tw.border} shrink-0 ${tw.bg.primary}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className={`text-sm leading-5 truncate ${tw.text.primary}`}>
                {[source?.name, formatDate(item.date), item.creator]
                  .filter(Boolean)
                  .join(' · ') || 'RSS Reader'}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {item.link && (
                <button
                  className={`p-1.5 rounded-md ${tw.hover} ${
                    store.fullContent ? tw.text.primary : tw.text.secondary
                  } ${
                    store.fullContentLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  title={t('loadFullContent')}
                  disabled={store.fullContentLoading}
                  onClick={() => store.loadFullContent()}
                >
                  {store.fullContentLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <FileText size={15} />
                  )}
                </button>
              )}
              {item.link && (
                <button
                  className={`p-1.5 rounded-md ${tw.hover} ${tw.text.secondary}`}
                  title={t('openInBrowser')}
                  onClick={() => rssReader.openExternal(item.link)}
                >
                  <ExternalLink size={15} />
                </button>
              )}
              <button
                className={`p-1.5 rounded-md ${tw.hover} ${tw.text.secondary}`}
                onClick={() => store.closeArticle()}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {store.fullContentLoading ? (
          <div
            className={`flex-1 flex items-center justify-center text-sm ${tw.text.tertiary}`}
          >
            {t('loadingFullContent')}
          </div>
        ) : displayContent ? (
          <iframe
            srcDoc={iframeContent}
            sandbox="allow-same-origin"
            className="flex-1 border-0 w-full"
            title={item.title}
          />
        ) : (
          <div
            className={`flex-1 flex items-center justify-center text-sm ${tw.text.tertiary}`}
          >
            {t('noContent')}
          </div>
        )}
      </div>
    </div>
  )
})
