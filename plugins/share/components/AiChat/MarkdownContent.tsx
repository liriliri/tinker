import { useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import * as prismStyles from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { tw } from '../../theme'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function omitNode<T extends { node?: unknown }>({ node, ...rest }: T) {
  return rest
}

export interface MarkdownContentProps {
  children: string
  isDark?: boolean
}

export default function MarkdownContent({
  children,
  isDark = false,
}: MarkdownContentProps) {
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
          className={`mb-3 last:mb-0 leading-7 ${tw.text.primary}`}
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
          className={`border-l-4 ${tw.border} pl-4 my-4 ${tw.text.secondary}`}
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
      a: ({ children: linkChildren, href, ...props }) => (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={`${tw.primary.text} underline hover:underline`}
          {...omitNode(props)}
        >
          {linkChildren}
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
            style={isDark ? prismStyles.oneDark : prismStyles.oneLight}
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
    [isDark]
  )

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}
