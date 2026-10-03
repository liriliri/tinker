import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toNum from 'licia/toNum'
import { tw } from 'share/theme'
import Select from 'share/components/Select'
import TextInput from 'share/components/TextInput'
import FileInput from 'share/components/FileInput'
import store from '../store'
import { IMAGE_SIZE_MAX, IMAGE_SIZE_MIN } from '../types'

const numberInputClass = `h-7 !py-0 !px-2 text-xs ${tw.bg.select}`

interface SizeFieldProps {
  label: string
  value: number
  onCommit: (value: number) => void
}

function SizeField({ label, value, onCommit }: SizeFieldProps) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    setText(String(value))
  }, [value])

  const commit = () => {
    onCommit(toNum(text))
  }

  return (
    <div>
      <label className={`text-xs font-medium mb-1 block ${tw.text.secondary}`}>
        {label}
      </label>
      <TextInput
        type="number"
        min={IMAGE_SIZE_MIN}
        max={IMAGE_SIZE_MAX}
        step={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit()
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        className={numberInputClass}
      />
    </div>
  )
}

export default observer(function GenOptions() {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <FileInput
        value={store.outputDir}
        readOnly
        placeholder={t('clearFolder')}
        onBrowse={() => void store.chooseOutputDir()}
        onClear={() => store.clearOutputDir()}
        className="h-7"
        inputClassName={`!py-0 !px-2 text-xs cursor-default ${tw.text.secondary}`}
        title={store.outputDir || t('clearFolder')}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            className={`text-xs font-medium mb-1 block ${tw.text.secondary}`}
          >
            {t('provider')}
          </label>
          <Select
            className="w-full"
            value={store.provider}
            onChange={(value) => store.setProvider(value)}
            options={store.providerOptions}
            disabled={!store.providerOptions.length}
          />
        </div>
        <div>
          <label
            className={`text-xs font-medium mb-1 block ${tw.text.secondary}`}
          >
            {t('model')}
          </label>
          <Select
            className="w-full"
            value={store.model}
            onChange={(value) => store.setModel(value)}
            options={store.modelOptions}
            disabled={!store.modelOptions.length}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SizeField
          label={t('width')}
          value={store.width}
          onCommit={(value) => store.setWidth(value)}
        />
        <SizeField
          label={t('height')}
          value={store.height}
          onCommit={(value) => store.setHeight(value)}
        />
      </div>
    </div>
  )
})
