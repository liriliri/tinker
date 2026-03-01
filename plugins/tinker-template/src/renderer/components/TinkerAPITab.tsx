import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import CopyButton from 'share/components/CopyButton'
import TextInput from 'share/components/TextInput'
import store from '../store'

export default observer(function TinkerAPITab() {
  const { t } = useTranslation()

  const handleContextMenu = (e: React.MouseEvent) => {
    tinker.showContextMenu(e.clientX, e.clientY, [
      { label: t('menuItem1'), click: () => {} },
      { label: t('menuItem2'), click: () => {} },
      { type: 'separator' },
      { label: t('menuItem3'), enabled: false },
    ])
  }

  return (
    <div className="space-y-4">
      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-1 ${tw.text.secondary}`}>
          {t('getTheme')} / {t('getLanguage')}
        </h2>
        <p className={`text-xs mb-4 ${tw.text.tertiary}`}>
          {t('getThemeDesc')}
        </p>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => store.fetchTheme()}
            className={`px-3 py-1.5 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white`}
          >
            {t('getTheme')}
          </button>
          <button
            onClick={() => store.fetchLanguage()}
            className={`px-3 py-1.5 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white`}
          >
            {t('getLanguage')}
          </button>
        </div>
        <div className="flex gap-4 text-xs">
          {store.theme && (
            <span className={tw.text.secondary}>
              {t('theme')}:{' '}
              <span className={`font-mono ${tw.primary.text}`}>
                {store.theme}
              </span>
            </span>
          )}
          {store.language && (
            <span className={tw.text.secondary}>
              {t('language')}:{' '}
              <span className={`font-mono ${tw.primary.text}`}>
                {store.language}
              </span>
            </span>
          )}
        </div>
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-1 ${tw.text.secondary}`}>
          {t('setTitle')}
        </h2>
        <p className={`text-xs mb-4 ${tw.text.tertiary}`}>
          {t('setTitleDesc')}
        </p>
        <div className="flex gap-2">
          <TextInput
            value={store.windowTitle}
            onChange={(e) => store.setWindowTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className="flex-1 text-xs"
          />
          <button
            onClick={() => store.applyWindowTitle()}
            disabled={!store.windowTitle}
            className={`px-3 py-1.5 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {t('apply')}
          </button>
        </div>
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-1 ${tw.text.secondary}`}>
          {t('showOpenDialog')}
        </h2>
        <p className={`text-xs mb-4 ${tw.text.tertiary}`}>
          {t('showOpenDialogDesc')}
        </p>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => store.openFile()}
            className={`px-3 py-1.5 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white`}
          >
            {t('openFile')}
          </button>
          {store.openedFilePath && (
            <button
              onClick={() => store.showInFinder()}
              className={`px-3 py-1.5 text-xs rounded border ${tw.border} ${tw.hover} ${tw.text.primary}`}
            >
              {t('showInFinder')}
            </button>
          )}
        </div>
        {store.openedFilePath && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded border ${tw.border} ${tw.bg.primary}`}
          >
            <span
              className={`font-mono text-xs ${tw.text.secondary} flex-1 truncate`}
            >
              {store.openedFilePath}
            </span>
            <CopyButton
              text={store.openedFilePath}
              size={12}
              variant="icon"
              className={tw.text.tertiary}
            />
          </div>
        )}
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-1 ${tw.text.secondary}`}>
          {t('getClipboardFilePaths')}
        </h2>
        <p className={`text-xs mb-4 ${tw.text.tertiary}`}>
          {t('getClipboardFilePathsDesc')}
        </p>
        <button
          onClick={() => store.fetchClipboardFiles()}
          className={`px-3 py-1.5 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white mb-3`}
        >
          {t('readClipboard')}
        </button>
        {store.clipboardFiles.length > 0 ? (
          <div className="space-y-1">
            {store.clipboardFiles.map((p) => (
              <div
                key={p}
                className={`flex items-center gap-2 px-3 py-2 rounded border ${tw.border} ${tw.bg.primary}`}
              >
                <span
                  className={`font-mono text-xs ${tw.text.secondary} flex-1 truncate`}
                >
                  {p}
                </span>
                <CopyButton
                  text={p}
                  size={12}
                  variant="icon"
                  className={tw.text.tertiary}
                />
              </div>
            ))}
          </div>
        ) : (
          store.clipboardFiles.length === 0 &&
          store.clipboardFiles !== undefined && (
            <p className={`text-xs ${tw.text.tertiary}`}>
              {t('noClipboardFiles')}
            </p>
          )
        )}
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-1 ${tw.text.secondary}`}>
          {t('showContextMenu')}
        </h2>
        <p className={`text-xs mb-4 ${tw.text.tertiary}`}>
          {t('showContextMenuDesc')}
        </p>
        <button
          onClick={handleContextMenu}
          className={`px-3 py-1.5 text-xs rounded border ${tw.border} ${tw.hover} ${tw.text.primary}`}
        >
          {t('rightClickMenu')}
        </button>
      </section>
    </div>
  )
})
