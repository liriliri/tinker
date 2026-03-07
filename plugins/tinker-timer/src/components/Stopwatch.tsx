import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { formatMs } from '../lib/util'
import ColonIcon from '../assets/colon.svg?react'

export default observer(function Stopwatch() {
  const { t } = useTranslation()

  const isIdle = !store.swRunning && store.swElapsed === 0
  const currentLapIndex = store.swLaps.length + 1

  const fastestIndex = store.swFastestIndex
  const slowestIndex = store.swSlowestIndex

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-center pt-6 pb-4 shrink-0">
        <div
          className={`flex items-center text-[5.5rem] font-thin tracking-tight leading-none tabular-nums ${tw.text.primary}`}
        >
          <span>{store.swDisplayParts[0]}</span>
          <ColonIcon width={22} height={88} className="shrink-0 fill-current" />
          <span>
            {store.swDisplayParts[1]}.{store.swDisplayParts[2]}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!isIdle && (
          <div className="max-w-sm mx-auto px-4">
            <div
              className={`grid grid-cols-3 text-sm pb-2 mb-1 border-b ${tw.border} ${tw.text.tertiary}`}
            >
              <span>{t('lapLabel')}</span>
              <span className="text-center">{t('splitLabel')}</span>
              <span className="text-right">{t('totalLabel')}</span>
            </div>

            <div
              className={`grid grid-cols-3 text-sm py-2 border-b tabular-nums ${tw.border} ${tw.text.primary}`}
            >
              <span>
                {t('lapLabel')}
                {currentLapIndex}
              </span>
              <span className="text-center">
                {formatMs(store.swCurrentLapTime)}
              </span>
              <span className="text-right">{store.swDisplay}</span>
            </div>

            {store.swLapsReversed.map((lap) => (
              <div
                key={lap.index}
                className={`grid grid-cols-3 text-sm py-2 border-b tabular-nums ${tw.border} ${tw.text.secondary}`}
              >
                <span>
                  {t('lapLabel')}
                  {lap.index}
                </span>
                <span
                  className={`text-center ${
                    lap.index === fastestIndex
                      ? tw.primary.text
                      : lap.index === slowestIndex
                      ? 'text-red-500'
                      : ''
                  }`}
                >
                  {formatMs(lap.lapTime)}
                </span>
                <span className="text-right">{formatMs(lap.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 flex gap-3 justify-center pb-6 pt-3">
        <button
          onClick={
            store.swRunning ? () => store.swLap() : () => store.swReset()
          }
          disabled={isIdle}
          className={`w-32 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-40
            ${tw.active} ${tw.text.primary}`}
        >
          {store.swRunning ? t('lap') : t('reset')}
        </button>
        <button
          onClick={
            store.swRunning ? () => store.swPause() : () => store.swStart()
          }
          className={`w-32 py-2 rounded-full text-sm font-medium text-white transition-colors
            ${tw.primary.bg} ${tw.primary.bgHover}`}
        >
          {store.swRunning ? t('pause') : isIdle ? t('start') : t('resume')}
        </button>
      </div>
    </div>
  )
})
