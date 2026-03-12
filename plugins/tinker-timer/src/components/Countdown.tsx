import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { pad } from '../lib/util'
import ColonIcon from '../assets/colon.svg?react'

interface TimeSegmentProps {
  label: string
  value: number
  max: number
  onChange: (value: number) => void
  editable: boolean
}

function Colon() {
  return (
    <ColonIcon
      width={20}
      height={80}
      className={`shrink-0 fill-current ${tw.text.primary}`}
    />
  )
}

const TimeSegment = observer(function TimeSegment({
  label,
  value,
  max,
  onChange,
  editable,
}: TimeSegmentProps) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleWheel = (e: React.WheelEvent) => {
    if (!editable) return
    e.preventDefault()
    onChange(Math.max(0, Math.min(max, e.deltaY < 0 ? value + 1 : value - 1)))
  }

  const handleFocus = () => {
    if (!editable) return
    setFocused(true)
    setDraft(String(value))
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleBlur = () => {
    setFocused(false)
    const parsed = parseInt(draft, 10)
    if (!isNaN(parsed)) onChange(Math.max(0, Math.min(max, parsed)))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value.replace(/\D/g, '').slice(0, 2))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(Math.min(max, value + 1))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(Math.max(0, value - 1))
    }
  }

  return (
    <div className="relative flex flex-col items-center" onWheel={handleWheel}>
      <div
        className={`rounded-xl px-1 transition-colors ${
          focused ? tw.primary.bgFocused : ''
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={focused ? draft : pad(value)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          readOnly={!editable}
          className={`w-28 text-[5rem] font-thin leading-none tracking-tight text-center tabular-nums
            bg-transparent outline-none py-0 ${
              editable ? 'cursor-text' : 'cursor-default'
            } ${tw.text.primary}`}
        />
      </div>
      <span className={`absolute bottom-full mb-2 text-sm ${tw.text.tertiary}`}>
        {label}
      </span>
    </div>
  )
})

export default observer(function Countdown() {
  const { t } = useTranslation()

  const { cdIsIdle, cdRunning, cdCompleted } = store

  const displayH = cdIsIdle ? store.cdHours : store.cdDisplayH
  const displayM = cdIsIdle ? store.cdMinutes : store.cdDisplayM
  const displayS = cdIsIdle ? store.cdSeconds : store.cdDisplayS

  return (
    <div className="h-full flex flex-col items-center justify-between">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <TimeSegment
            label={t('hours')}
            value={displayH}
            max={23}
            onChange={(v) => store.setCdHours(v)}
            editable={cdIsIdle}
          />
          <Colon />
          <TimeSegment
            label={t('minutes')}
            value={displayM}
            max={59}
            onChange={(v) => store.setCdMinutes(v)}
            editable={cdIsIdle}
          />
          <Colon />
          <TimeSegment
            label={t('seconds')}
            value={displayS}
            max={59}
            onChange={(v) => store.setCdSeconds(v)}
            editable={cdIsIdle}
          />
        </div>
      </div>

      <div className="shrink-0 flex gap-3 justify-center pb-6 w-full">
        <button
          onClick={() => store.cdReset()}
          disabled={cdIsIdle}
          className={`w-32 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-40
            ${tw.active} ${tw.text.primary}`}
        >
          {t('cancel')}
        </button>
        <button
          onClick={() => {
            if (cdCompleted) {
              store.cdReset()
            } else if (cdRunning) {
              store.cdPause()
            } else {
              store.cdStart()
            }
          }}
          disabled={cdIsIdle && !store.cdCanStart}
          className={`w-32 py-2 rounded-full text-sm font-medium text-white transition-colors
            disabled:opacity-40 ${tw.primary.bg} ${tw.primary.bgHover}`}
        >
          {cdCompleted
            ? t('reset')
            : cdRunning
            ? t('pause')
            : cdIsIdle
            ? t('startTimer')
            : t('resume')}
        </button>
      </div>
    </div>
  )
})
