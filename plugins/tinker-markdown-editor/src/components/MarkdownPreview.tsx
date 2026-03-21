import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useRef } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { tw } from 'share/theme'
import store from '../store'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function omitNode<T extends { node?: unknown }>({ node, ...rest }: T) {
  return rest
}

export default observer(function MarkdownPreview() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const maxScroll = scrollHeight - clientHeight
      const scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 0

      if (Math.abs(store.scrollPercent - scrollPercent) > 0.001) {
        store.setScrollPercent(scrollPercent)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const { scrollHeight, clientHeight } = container
    const maxScroll = scrollHeight - clientHeight
    if (maxScroll <= 0) return

    const currentPercent = container.scrollTop / maxScroll
    if (Math.abs(currentPercent - store.scrollPercent) > 0.001) {
      container.scrollTop = maxScroll * store.scrollPercent
    }
  }, [store.scrollPercent])

  const components = useMemo<Components>(
    () => ({
      h1: (props) => (
        <h1
          className={`text-2xl font-bold mt-0 mb-4 pb-2 border-b ${tw.border} ${tw.text.primary}`}
          {...omitNode(props)}
        />
      ),
      h2: (props) => (
        <h2
          className={`text-xl font-semibold mt-7 mb-3 pb-1 border-b ${tw.border} ${tw.text.primary}`}
          {...omitNode(props)}
        />
      ),
      h3: (props) => (
        <h3
          className={`text-lg font-semibold mt-6 mb-2 ${tw.text.primary}`}
          {...omitNode(props)}
        />
      ),
      h4: (props) => (
        <h4
          className={`text-base font-semibold mt-5 mb-2 ${tw.text.primary}`}
          {...omitNode(props)}
        />
      ),
      h5: (props) => (
        <h5
          className={`text-sm font-semibold mt-4 mb-1 ${tw.text.secondary}`}
          {...omitNode(props)}
        />
      ),
      h6: (props) => (
        <h6
          className={`text-sm font-semibold mt-4 mb-1 ${tw.text.tertiary}`}
          {...omitNode(props)}
        />
      ),
      p: (props) => (
        <p
          className={`mb-3 leading-7 ${tw.text.primary}`}
          {...omitNode(props)}
        />
      ),
      ul: (props) => (
        <ul
          className={`list-disc pl-6 mb-3 space-y-1 ${tw.text.primary}`}
          {...omitNode(props)}
        />
      ),
      ol: (props) => (
        <ol
          className={`list-decimal pl-6 mb-3 space-y-1 ${tw.text.primary}`}
          {...omitNode(props)}
        />
      ),
      li: (props) => <li className="leading-7" {...omitNode(props)} />,
      blockquote: (props) => (
        <blockquote
          className={`border-l-4 border-l-gray-300 dark:border-l-gray-600 pl-4 my-4 ${tw.text.secondary}`}
          {...omitNode(props)}
        />
      ),
      hr: (props) => (
        <hr className={`my-6 ${tw.border}`} {...omitNode(props)} />
      ),
      table: (props) => (
        <div className="overflow-x-auto mb-4">
          <table
            className={`min-w-full border-collapse border ${tw.border}`}
            {...omitNode(props)}
          />
        </div>
      ),
      tr: (props) => (
        <tr
          className="even:bg-gray-50 dark:even:bg-gray-800/50"
          {...omitNode(props)}
        />
      ),
      th: (props) => (
        <th
          className={`px-3 py-2 font-semibold text-left border ${tw.border} ${tw.bg.secondary} ${tw.text.primary}`}
          {...omitNode(props)}
        />
      ),
      td: (props) => (
        <td
          className={`px-3 py-2 border ${tw.border} ${tw.text.primary}`}
          {...omitNode(props)}
        />
      ),
      img: (props) => (
        <img
          className="max-w-full rounded my-2"
          alt={props.alt}
          {...omitNode(props)}
        />
      ),
      a: ({ children, href, ...props }) => (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 hover:text-blue-600 underline"
          {...omitNode(props)}
        >
          {children}
        </a>
      ),
      code: ({ className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || '')
        const isInline = !String(children).includes('\n')
        if (isInline) {
          return (
            <code
              className={`rounded px-1.5 py-0.5 font-mono text-[0.875em] ${tw.bg.secondary} ${tw.text.primary}`}
              {...props}
            >
              {children}
            </code>
          )
        }
        return (
          <SyntaxHighlighter
            style={store.isDark ? oneDark : oneLight}
            language={match?.[1] || 'text'}
            PreTag="div"
            customStyle={{
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '13px',
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        )
      },
    }),
    [store.isDark]
  )

  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-auto p-6 text-sm ${tw.bg.primary}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={components}
      >
        {store.markdownInput}
      </ReactMarkdown>
    </div>
  )
})
