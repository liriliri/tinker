import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import store from '../store'

interface CharacterTypesTableProps {
  onInputChange: () => void
}

export default observer(function CharacterTypesTable({
  onInputChange,
}: CharacterTypesTableProps) {
  const { t } = useTranslation()

  return (
    <div className={`overflow-x-auto rounded border ${tw.border}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className={`${tw.bg.secondary}`}>
            <td className="w-32"></td>
            {store.charTypes.map((char) => (
              <th
                key={char.key}
                scope="col"
                className={`px-4 py-2.5 text-xs font-semibold text-center ${tw.text.primary}`}
              >
                {t(char.labelKey)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className={`border-t ${tw.border} ${tw.hover} transition-colors`}>
            <th
              scope="row"
              className={`px-4 py-3 text-left text-xs font-semibold ${tw.text.primary} ${tw.bg.secondary}`}
            >
              <label className="flex items-center gap-2">
                <span className="whitespace-nowrap">{t('required')}</span>
                <TextInput
                  type="number"
                  min="1"
                  max="9"
                  value={store.required}
                  onChange={(e) => {
                    store.setRequired(Number(e.target.value))
                    onInputChange()
                  }}
                  className="w-10 px-1.5 py-1 text-xs text-center"
                />
              </label>
            </th>
            {store.charTypes.map((char) => (
              <td key={char.key} className="px-4 py-3 text-center">
                <input
                  type="radio"
                  name={char.key}
                  checked={char.state === 'required'}
                  onChange={() => {
                    char.setter('required')
                    onInputChange()
                  }}
                  className={`w-4 h-4 cursor-pointer ${tw.primary.accent}`}
                />
              </td>
            ))}
          </tr>

          <tr className={`border-t ${tw.border} ${tw.hover} transition-colors`}>
            <th
              scope="row"
              className={`px-4 py-3 text-left text-xs font-semibold ${tw.text.primary} ${tw.bg.secondary}`}
            >
              {t('allowed')}
            </th>
            {store.charTypes.map((char) => (
              <td key={char.key} className="px-4 py-3 text-center">
                <input
                  type="radio"
                  name={char.key}
                  checked={char.state === 'allowed'}
                  onChange={() => {
                    char.setter('allowed')
                    onInputChange()
                  }}
                  className={`w-4 h-4 cursor-pointer ${tw.primary.accent}`}
                />
              </td>
            ))}
          </tr>

          <tr className={`border-t ${tw.border} ${tw.hover} transition-colors`}>
            <th
              scope="row"
              className={`px-4 py-3 text-left text-xs font-semibold ${tw.text.primary} ${tw.bg.secondary}`}
            >
              {t('forbidden')}
            </th>
            {store.charTypes.map((char) => (
              <td key={char.key} className="px-4 py-3 text-center">
                <input
                  type="radio"
                  name={char.key}
                  checked={char.state === 'forbidden'}
                  onChange={() => {
                    char.setter('forbidden')
                    onInputChange()
                  }}
                  className={`w-4 h-4 cursor-pointer ${tw.primary.accent}`}
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
})
