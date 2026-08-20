import { useTranslation } from 'react-i18next'
import filter from 'licia/filter'
import find from 'licia/find'
import { contentSections, sectionHasContent } from '../../lib/menu'
import { contactLines } from '../../lib/util'
import type { ResumeTemplateProps } from '../../types'
import SectionBody from './SectionBody'

export default function SidebarTemplate({
  resume,
  themeColor,
}: ResumeTemplateProps) {
  const { t } = useTranslation()
  const { basic } = resume
  const contacts = contactLines(basic)
  const sections = contentSections(resume)
  const education = find(sections, (section) => section.id === 'education')
  const mainSections = filter(sections, (section) => section.id !== 'education')

  return (
    <div className="flex min-h-[297mm] bg-white text-zinc-800 font-sans">
      <aside
        className="w-[32%] text-white p-7 flex flex-col"
        style={{ backgroundColor: themeColor }}
      >
        {basic.photo && (
          <img
            src={basic.photo}
            alt=""
            className="w-24 h-24 rounded-full object-cover mx-auto mb-5 ring-2 ring-white/30"
          />
        )}
        <h1 className="text-2xl font-bold leading-tight">{basic.name}</h1>
        <p className="text-sm text-slate-200 mt-1 mb-6">{basic.title}</p>

        <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase border-b border-white/20 pb-1 mb-3">
          {t('basic')}
        </h2>
        <div className="space-y-1.5 text-xs text-slate-100 break-all mb-8">
          {contacts.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>

        {education && sectionHasContent(resume, education.id) && (
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase border-b border-white/20 pb-1 mb-3">
              {t(education.id)}
            </h2>
            <SectionBody
              resume={resume}
              sectionId={education.id}
              variant="rail"
            />
          </div>
        )}
      </aside>

      <main className="flex-1 p-8">
        {mainSections.map((section) => {
          if (!sectionHasContent(resume, section.id)) return null
          return (
            <section key={section.id} className="mb-6">
              <h2
                className="text-[11px] font-bold tracking-[0.2em] uppercase border-b-2 pb-1 mb-3"
                style={{ color: themeColor, borderColor: themeColor }}
              >
                {t(section.id)}
              </h2>
              <SectionBody
                resume={resume}
                sectionId={section.id}
                variant="sidebar"
              />
            </section>
          )
        })}
      </main>
    </div>
  )
}
