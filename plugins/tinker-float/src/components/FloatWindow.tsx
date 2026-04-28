import { tw } from 'share/theme'

interface FloatWindowProps {
  contentType: 'image' | 'text'
  imageDataUrl: string
  textContent: string
}

export default function FloatWindow({
  contentType,
  imageDataUrl,
  textContent,
}: FloatWindowProps) {
  return (
    <div
      className={`h-screen overflow-auto ${tw.bg.primary}`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {contentType === 'image' ? (
        <img src={imageDataUrl} className="w-full h-full object-cover" />
      ) : (
        <pre
          className={`whitespace-pre-wrap break-words text-sm font-sans p-4 ${tw.text.primary}`}
        >
          {textContent}
        </pre>
      )}
    </div>
  )
}
