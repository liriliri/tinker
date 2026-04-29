import { tw } from 'share/theme'

interface FloatWindowProps {
  contentType: 'image' | 'text' | 'video'
  imageDataUrl: string
  textContent: string
  videoSrc: string
}

export default function FloatWindow({
  contentType,
  imageDataUrl,
  textContent,
  videoSrc,
}: FloatWindowProps) {
  return (
    <div
      className={`h-screen overflow-hidden flex flex-col ${
        contentType === 'video' ? 'bg-black' : tw.bg.primary
      }`}
    >
      {contentType === 'video' && (
        <div
          className="h-5 shrink-0"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        />
      )}
      {contentType === 'image' && (
        <img
          src={imageDataUrl}
          className="w-full h-full object-cover"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        />
      )}
      {contentType === 'video' && (
        <video
          src={videoSrc}
          className="block w-full flex-1 min-h-0"
          autoPlay
          controls
        />
      )}
      {contentType === 'text' && (
        <pre
          className={`whitespace-pre-wrap break-words text-sm font-sans p-4 ${tw.text.primary}`}
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {textContent}
        </pre>
      )}
    </div>
  )
}
