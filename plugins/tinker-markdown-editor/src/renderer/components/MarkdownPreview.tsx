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
    <div className="h-full w-full overflow-auto bg-white dark:bg-[#1e1e1e] p-4">
      <div
        className="markdown-preview prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
})
