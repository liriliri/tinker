import compact from 'licia/compact'
import { visibleItems } from '../../lib/util'
import type { ResumeData } from '../../types'
import HtmlBlock from './HtmlBlock'

type SectionVariant = 'classic' | 'sidebar' | 'rail'

interface SectionBodyProps {
  resume: ResumeData
  sectionId: string
  variant: SectionVariant
}

export default function SectionBody({
  resume,
  sectionId,
  variant,
}: SectionBodyProps) {
  if (sectionId === 'skills') {
    return <HtmlBlock text={resume.skillContent} className="text-[13px]" />
  }

  if (sectionId === 'experience') {
    return visibleItems(resume.experience).map((item) => (
      <div key={item.id} className={itemGap(variant)}>
        <ItemHead
          title={item.company}
          subtitle={item.position}
          date={item.date}
          variant={variant}
        />
        <HtmlBlock
          text={item.details}
          className={`mt-1 text-[13px] ${railText(variant)}`}
        />
      </div>
    ))
  }

  if (sectionId === 'projects') {
    return visibleItems(resume.projects).map((item) => (
      <div key={item.id} className={itemGap(variant)}>
        <ItemHead
          title={item.name}
          subtitle={item.role}
          date={item.date}
          variant={variant}
          subtitleInline
        />
        <HtmlBlock
          text={item.description}
          className={`mt-1 text-[13px] ${railText(variant)}`}
        />
      </div>
    ))
  }

  if (sectionId === 'education') {
    return visibleItems(resume.education).map((item) => (
      <div key={item.id} className={itemGap(variant)}>
        <ItemHead
          title={item.school}
          subtitle={compact([item.major, item.degree]).join(' · ')}
          date={`${item.startDate} - ${item.endDate}`}
          variant={variant}
        />
        <HtmlBlock
          text={item.description}
          className={`mt-1 text-[13px] ${railText(variant)}`}
        />
      </div>
    ))
  }

  if (sectionId === 'selfEvaluation') {
    return (
      <HtmlBlock text={resume.selfEvaluationContent} className="text-[13px]" />
    )
  }

  if (sectionId === 'certificates') {
    return visibleItems(resume.certificates).map((item) => (
      <div key={item.id} className={itemGap(variant)}>
        <ItemHead
          title={item.name}
          subtitle={item.issuer}
          date={item.date}
          variant={variant}
          subtitleInline
        />
        <HtmlBlock
          text={item.description}
          className={`mt-1 text-[13px] ${railText(variant)}`}
        />
      </div>
    ))
  }

  return null
}

interface ItemHeadProps {
  title: string
  subtitle: string
  date: string
  variant: SectionVariant
  subtitleInline?: boolean
}

function ItemHead({
  title,
  subtitle,
  date,
  variant,
  subtitleInline,
}: ItemHeadProps) {
  if (variant === 'rail') {
    return (
      <>
        <div className="font-semibold text-sm">{title}</div>
        {subtitle ? (
          <div className="text-xs text-slate-200 mt-0.5">{subtitle}</div>
        ) : null}
        {date ? (
          <div className="text-[11px] text-slate-300 mt-0.5">{date}</div>
        ) : null}
      </>
    )
  }

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-bold text-[15px]">
          {title}
          {subtitle && subtitleInline ? (
            <span className="font-normal text-zinc-600"> · {subtitle}</span>
          ) : null}
        </div>
        {date ? (
          <div className="text-xs text-zinc-500 shrink-0">{date}</div>
        ) : null}
      </div>
      {subtitle && !subtitleInline ? (
        <div className="text-sm text-zinc-600">{subtitle}</div>
      ) : null}
    </>
  )
}

function itemGap(variant: SectionVariant) {
  if (variant === 'classic') return 'mt-3'
  return 'mb-4'
}

function railText(variant: SectionVariant) {
  return variant === 'rail' ? 'text-slate-100' : ''
}
