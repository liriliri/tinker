import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { tw } from 'share/theme'
import Slider from 'share/components/Slider'
import Checkbox from 'share/components/Checkbox'
import Select from 'share/components/Select'
import TextInput from 'share/components/TextInput'
import CopyButton from 'share/components/CopyButton'
import { LoadingCircle } from 'share/components/Loading'
import store from '../store'

export default observer(function ComponentsTab() {
  const { t } = useTranslation()
  const [color, setColor] = useState('#0fc25e')

  return (
    <div className="space-y-4">
      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-4 ${tw.text.secondary}`}>
          {t('checkboxDemo')}
        </h2>
        <div className="flex flex-wrap gap-4">
          <Checkbox
            checked={store.checkboxChecked}
            onChange={(v) => store.setCheckboxChecked(v)}
          >
            {t('checkboxLabel')}
          </Checkbox>
          <Checkbox checked={true} onChange={() => {}}>
            {t('checkboxChecked')}
          </Checkbox>
          <Checkbox checked={false} onChange={() => {}} disabled>
            {t('checkboxDisabled')}
          </Checkbox>
        </div>
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-4 ${tw.text.secondary}`}>
          {t('selectDemo')}
        </h2>
        <div className="flex items-center gap-3">
          <Select
            value={store.selectValue}
            onChange={(v) => store.setSelectValue(v)}
            options={[
              { label: t('option1'), value: 'option1' },
              { label: t('option2'), value: 'option2' },
              { label: t('option3'), value: 'option3' },
            ]}
          />
          <span className={`text-xs ${tw.text.secondary}`}>
            {t('selected')}:{' '}
            <span className={tw.primary.text}>{store.selectValue}</span>
          </span>
        </div>
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-4 ${tw.text.secondary}`}>
          {t('sliderDemo')}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className={tw.text.secondary}>{t('value')}</span>
            <span className={`font-mono ${tw.primary.text}`}>
              {store.sliderValue}
            </span>
          </div>
          <Slider
            value={store.sliderValue}
            min={0}
            max={100}
            onChange={(v) => store.setSliderValue(v)}
          />
          <div className="flex justify-between text-xs">
            <span className={tw.text.tertiary}>0</span>
            <span className={tw.text.tertiary}>100</span>
          </div>
        </div>
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-4 ${tw.text.secondary}`}>
          {t('textInputDemo')}
        </h2>
        <div className="flex items-center gap-2">
          <TextInput
            value={store.textInputValue}
            onChange={(e) => store.setTextInputValue(e.target.value)}
            placeholder={t('typeHere')}
            className="flex-1"
          />
          <CopyButton
            text={store.textInputValue}
            disabled={!store.textInputValue}
          />
        </div>
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-4 ${tw.text.secondary}`}>
          {t('loadingDemo')}
        </h2>
        <div className="flex items-center gap-4">
          {store.isLoading ? (
            <LoadingCircle />
          ) : (
            <button
              onClick={() => store.toggleLoading()}
              className={`px-3 py-1.5 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white`}
            >
              {t('startLoading')}
            </button>
          )}
          <span className={`text-xs ${tw.text.secondary}`}>
            {store.isLoading ? t('loadingActive') : t('loadingIdle')}
          </span>
        </div>
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-4 ${tw.text.secondary}`}>
          {t('colorDemo')}
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
          />
          <div
            className="w-16 h-8 rounded border"
            style={{ backgroundColor: color, borderColor: color }}
          />
          <CopyButton text={color} variant="default" />
          <span className={`font-mono text-xs ${tw.text.secondary}`}>
            {color}
          </span>
        </div>
      </section>
    </div>
  )
})
