import { textToHtml } from '../../lib/util'

interface HtmlBlockProps {
  text: string
  className?: string
}

export default function HtmlBlock({ text, className = '' }: HtmlBlockProps) {
  const html = textToHtml(text)
  if (!html) return null

  return (
    <div
      className={`[&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
