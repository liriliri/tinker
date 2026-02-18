import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'

interface InfoSectionProps {
  title?: string
  children: React.ReactNode
}

export default observer(function InfoSection({
  title,
  children,
}: InfoSectionProps) {
  return (
    <div className="mb-6">
      {title && (
        <h2 className={`text-base font-semibold mb-3 ${tw.text.primary}`}>
          {title}
        </h2>
      )}
      <div
        className={`${tw.bg.tertiary} ${tw.border} border rounded-lg overflow-hidden`}
      >
        {children}
      </div>
    </div>
  )
})
