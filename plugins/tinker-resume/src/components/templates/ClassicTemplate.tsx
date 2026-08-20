import { useTranslation } from 'react-i18next'
import { contentSections, sectionHasContent } from '../../lib/menu'
import { contactLines } from '../../lib/util'
import type { ResumeTemplateProps } from '../../types'
import SectionBody from './SectionBody'

interface PhotoProps {
  src: string
  className: string
}

function Photo({ src, className }: PhotoProps) {
  if (!src) return null
  return <img src={src} alt="" className={className} />
}

export default function ClassicTemplate({
  resume,
  themeColor,
}: ResumeTemplateProps) {
  const { t } = useTranslation()
  const { basic } = resume
  const contacts = contactLines(basic)

  return (
    <div className="bg-white text-zinc-800 font-serif p-10 min-h-[297mm]">
      <header
        className="flex items-start justify-between gap-6 pb-6 border-b-2"
        style={{ borderColor: themeColor }}
      >
        <div className="flex items-start gap-5 min-w-0">
          <Photo
            src={basic.photo}
            className="h-24 w-20 object-cover shrink-0"
          />
          <div className="min-w-0">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: themeColor }}
            >
              {basic.name}
            </h1>
            <p className="text-lg mt-1 text-zinc-600">{basic.title}</p>
          </div>
        </div>
        <div className="text-right text-xs leading-5 shrink-0 text-zinc-600">
          {contacts.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </header>

      {contentSections(resume).map((section) => {
        if (!sectionHasContent(resume, section.id)) return null
        return (
          <section key={section.id} className="mt-6">
            <h2
              className="text-sm font-bold tracking-widest uppercase border-b pb-1 mb-2"
              style={{ color: themeColor, borderColor: themeColor }}
            >
              {t(section.id)}
            </h2>
            <SectionBody
              resume={resume}
              sectionId={section.id}
              variant="classic"
            />
          </section>
        )
      })}
    </div>
  )
}
