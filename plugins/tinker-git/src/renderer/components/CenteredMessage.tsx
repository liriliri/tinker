import { tw } from 'share/theme'

interface CenteredMessageProps {
  children: React.ReactNode
}

export default function CenteredMessage({ children }: CenteredMessageProps) {
  return (
    <div
      className={`h-full flex items-center justify-center p-4 ${tw.text.secondary}`}
    >
      {children}
    </div>
  )
}
