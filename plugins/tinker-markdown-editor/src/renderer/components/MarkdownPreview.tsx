import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import remarkGfm from 'remark-gfm'
import store from '../store'

export default observer(function MarkdownPreview() {
  const [html, setHtml] = useState('')

  useEffect(() => {
    const convertMarkdown = async () => {
      if (!store.markdownInput) {
        setHtml('')
        return
      }

      try {
        const result = await remark()
          .use(remarkGfm)
          .use(remarkHtml)
          .process(store.markdownInput)

        setHtml(String(result))
      } catch (err) {
        console.error('Failed to convert markdown:', err)
        setHtml('<p style="color: red;">Failed to render markdown</p>')
      }
    }

    convertMarkdown()
  }, [store.markdownInput])

  return (
    <div
      className="markdown-preview-container h-full w-full overflow-auto p-6 bg-white dark:bg-[#1e1e1e]"
      data-color-mode={store.isDark ? 'dark' : 'light'}
    >
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
})
