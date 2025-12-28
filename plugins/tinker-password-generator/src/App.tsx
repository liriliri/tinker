import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import store, { CharsetState } from './store'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'

export default observer(function App() {
  const { t } = useTranslation()
  const { copied, copyToClipboard } = useCopyToClipboard()

  const handleCopy = () => {
    if (store.generatedPassword) {
      copyToClipboard(store.generatedPassword)
    }
  }

  // Auto-generate on input change
  const handleInputChange = () => {
    if (store.phrase && store.service) {
      try {
        store.generatePassword()
      } catch (error) {
        console.error('Failed to generate password:', error)
      }
    } else {
      // Clear password if either field is empty
      store.generatedPassword = ''
    }
  }

  const charTypes = [
    {
      key: 'lower',
      label: t('lowercase'),
      state: store.lower,
      setter: (state: CharsetState) => store.setLower(state),
    },
    {
      key: 'upper',
      label: t('uppercase'),
      state: store.upper,
      setter: (state: CharsetState) => store.setUpper(state),
    },
    {
      key: 'number',
      label: t('numbers'),
      state: store.number,
      setter: (state: CharsetState) => store.setNumber(state),
    },
    {
      key: 'dash',
      label: t('dashUnderscore'),
      state: store.dash,
      setter: (state: CharsetState) => store.setDash(state),
    },
    {
      key: 'space',
      label: t('space'),
      state: store.space,
      setter: (state: CharsetState) => store.setSpace(state),
    },
    {
      key: 'symbol',
      label: t('symbols'),
      state: store.symbol,
      setter: (state: CharsetState) => store.setSymbol(state),
    },
  ]

  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.light.secondary} ${tw.bg.dark.secondary} transition-colors`}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Service Name and Passphrase */}
          <div className="grid grid-cols-2 gap-4">
            {/* Service Name */}
            <div>
              <label
                className={`block text-sm mb-2 font-medium ${tw.text.light.primary} ${tw.text.dark.primary}`}
              >
                {t('serviceName')}{' '}
                <span
                  className={`text-xs font-normal ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
                >
                  {t('serviceExample')}
                </span>
              </label>
              <input
                type="text"
                value={store.service}
                onChange={(e) => {
                  store.setService(e.target.value)
                  handleInputChange()
                }}
                className={`w-full px-3 py-2 rounded border ${tw.bg.light.input} ${tw.bg.dark.input} ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.border.both} focus:outline-none ${tw.primary.focusBorder} transition-colors`}
              />
            </div>

            {/* Passphrase */}
            <div>
              <label
                className={`block text-sm mb-2 font-medium ${tw.text.light.primary} ${tw.text.dark.primary}`}
              >
                {t('passphrase')}{' '}
                <span
                  className={`text-xs font-normal ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
                >
                  {t('passphraseExample')}
                </span>
              </label>
              <div className="relative">
                <input
                  type={store.showPhrase ? 'text' : 'password'}
                  value={store.phrase}
                  onChange={(e) => {
                    store.setPhrase(e.target.value)
                    handleInputChange()
                  }}
                  className={`w-full px-3 py-2 pr-11 rounded border ${tw.bg.light.input} ${tw.bg.dark.input} ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.border.both} focus:outline-none ${tw.primary.focusBorder} transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => store.toggleShowPhrase()}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${tw.text.light.secondary} ${tw.text.dark.secondary} hover:opacity-70 transition-opacity`}
                  title={
                    store.showPhrase ? 'Hide passphrase' : 'Show passphrase'
                  }
                >
                  {store.showPhrase ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Length and Max Repetition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm mb-2 font-medium ${tw.text.light.primary} ${tw.text.dark.primary}`}
              >
                {t('passwordLength')}{' '}
                <span
                  className={`text-xs font-normal ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
                >
                  {t('lengthExample')}
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={store.length}
                onChange={(e) => {
                  store.setLength(Number(e.target.value))
                  handleInputChange()
                }}
                className={`w-full px-3 py-2 rounded border ${tw.bg.light.input} ${tw.bg.dark.input} ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.border.both} focus:outline-none ${tw.primary.focusBorder} transition-colors`}
              />
            </div>
            <div>
              <label
                className={`block text-sm mb-2 font-medium ${tw.text.light.primary} ${tw.text.dark.primary}`}
              >
                {t('maxRepetition')}{' '}
                <span
                  className={`text-xs font-normal ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
                >
                  {t('repetitionExample')}
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="9"
                value={store.repeat}
                onChange={(e) => {
                  store.setRepeat(Number(e.target.value))
                  handleInputChange()
                }}
                className={`w-full px-3 py-2 rounded border ${tw.bg.light.input} ${tw.bg.dark.input} ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.border.both} focus:outline-none ${tw.primary.focusBorder} transition-colors`}
              />
            </div>
          </div>

          {/* Character Types Table */}
          <div className={`overflow-x-auto rounded border ${tw.border.both}`}>
            <table className="w-full border-collapse">
              <thead>
                <tr
                  className={`${tw.bg.light.secondary} ${tw.bg.dark.secondary}`}
                >
                  <td className="w-32"></td>
                  {charTypes.map((char) => (
                    <th
                      key={char.key}
                      scope="col"
                      className={`px-4 py-2.5 text-xs font-semibold text-center ${tw.text.light.primary} ${tw.text.dark.primary}`}
                    >
                      {char.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Required Row */}
                <tr
                  className={`border-t ${tw.border.both} ${tw.hover.both} transition-colors`}
                >
                  <th
                    scope="row"
                    className={`px-4 py-3 text-left text-xs font-semibold ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.bg.light.secondary} ${tw.bg.dark.secondary}`}
                  >
                    <label className="flex items-center gap-2">
                      <span className="whitespace-nowrap">{t('required')}</span>
                      <input
                        type="number"
                        min="1"
                        max="9"
                        value={store.required}
                        onChange={(e) => {
                          store.setRequired(Number(e.target.value))
                          handleInputChange()
                        }}
                        className={`w-10 px-1.5 py-1 text-xs text-center rounded border ${tw.bg.light.input} ${tw.bg.dark.input} ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.border.both} focus:outline-none ${tw.primary.focusBorder}`}
                      />
                    </label>
                  </th>
                  {charTypes.map((char) => (
                    <td key={char.key} className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={char.key}
                        checked={char.state === 'required'}
                        onChange={() => {
                          char.setter('required')
                          handleInputChange()
                        }}
                        className="w-4 h-4 cursor-pointer accent-[#0fc25e]"
                      />
                    </td>
                  ))}
                </tr>

                {/* Allowed Row */}
                <tr
                  className={`border-t ${tw.border.both} ${tw.hover.both} transition-colors`}
                >
                  <th
                    scope="row"
                    className={`px-4 py-3 text-left text-xs font-semibold ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.bg.light.secondary} ${tw.bg.dark.secondary}`}
                  >
                    {t('allowed')}
                  </th>
                  {charTypes.map((char) => (
                    <td key={char.key} className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={char.key}
                        checked={char.state === 'allowed'}
                        onChange={() => {
                          char.setter('allowed')
                          handleInputChange()
                        }}
                        className="w-4 h-4 cursor-pointer accent-[#0fc25e]"
                      />
                    </td>
                  ))}
                </tr>

                {/* Forbidden Row */}
                <tr
                  className={`border-t ${tw.border.both} ${tw.hover.both} transition-colors`}
                >
                  <th
                    scope="row"
                    className={`px-4 py-3 text-left text-xs font-semibold ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.bg.light.secondary} ${tw.bg.dark.secondary}`}
                  >
                    {t('forbidden')}
                  </th>
                  {charTypes.map((char) => (
                    <td key={char.key} className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={char.key}
                        checked={char.state === 'forbidden'}
                        onChange={() => {
                          char.setter('forbidden')
                          handleInputChange()
                        }}
                        className="w-4 h-4 cursor-pointer accent-[#0fc25e]"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Generated Password */}
          <div className="relative">
            <input
              type="text"
              value={store.generatedPassword}
              readOnly
              placeholder={t('generatedPassword')}
              className={`w-full px-3 py-2 pr-11 rounded border font-mono text-sm ${tw.bg.light.input} ${tw.bg.dark.input} ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.border.both} select-all focus:outline-none ${tw.primary.focusBorder}`}
            />
            {store.generatedPassword && (
              <button
                onClick={handleCopy}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center ${
                  copied
                    ? tw.primary.text
                    : `${tw.text.light.tertiary} ${tw.text.dark.tertiary}`
                } rounded transition-colors`}
                title={copied ? t('copied') : t('copyToClipboard')}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
