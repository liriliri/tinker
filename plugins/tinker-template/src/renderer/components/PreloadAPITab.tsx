import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import CopyButton from 'share/components/CopyButton'
import TextInput from 'share/components/TextInput'
import store from '../store'

export default observer(function PreloadAPITab() {
  const { t } = useTranslation()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') store.runCommand()
  }

  return (
    <div className="space-y-4">
      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-1 ${tw.text.secondary}`}>
          execCommand
        </h2>
        <p className={`text-xs mb-4 ${tw.text.tertiary}`}>
          {t('execCommandDesc')}
        </p>
        <div className="flex gap-2 mb-3">
          <TextInput
            value={store.cmdInput}
            onChange={(e) => store.setCmdInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('cmdPlaceholder')}
            className="flex-1 text-xs font-mono"
          />
          <button
            onClick={() => store.runCommand()}
            disabled={!store.cmdInput || store.cmdRunning}
            className={`px-3 py-1.5 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {store.cmdRunning ? t('running') : t('run')}
          </button>
        </div>
        {(store.cmdOutput || store.cmdError) && (
          <div
            className={`relative rounded border ${tw.border} ${tw.bg.primary}`}
          >
            <pre
              className={`font-mono text-xs p-3 whitespace-pre-wrap break-all max-h-48 overflow-y-auto ${
                store.cmdError
                  ? 'text-red-500 dark:text-red-400'
                  : tw.text.secondary
              }`}
            >
              {store.cmdError || store.cmdOutput}
            </pre>
            <div className="absolute top-2 right-2">
              <CopyButton
                text={store.cmdError || store.cmdOutput}
                size={12}
                variant="icon"
                className={tw.text.tertiary}
              />
            </div>
          </div>
        )}
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-1 ${tw.text.secondary}`}>
          getSystemInfo
        </h2>
        <p className={`text-xs mb-4 ${tw.text.tertiary}`}>
          {t('getSystemInfoDesc')}
        </p>
        <button
          onClick={() => store.fetchSystemInfo()}
          className={`px-3 py-1.5 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white mb-3`}
        >
          {t('getInfo')}
        </button>
        {store.systemInfo && (
          <div
            className={`space-y-1.5 px-3 py-3 rounded border ${tw.border} ${tw.bg.primary}`}
          >
            {(
              [
                ['platform', store.systemInfo.platform],
                ['arch', store.systemInfo.arch],
                ['homeDir', store.systemInfo.homeDir],
                ['nodeVersion', store.systemInfo.nodeVersion],
              ] as [string, string][]
            ).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs w-24 shrink-0 ${tw.text.tertiary}`}
                >
                  {key}
                </span>
                <span
                  className={`font-mono text-xs ${tw.text.secondary} flex-1 truncate`}
                >
                  {val}
                </span>
                <CopyButton
                  text={val}
                  size={12}
                  variant="icon"
                  className={tw.text.tertiary}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
})
