import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import CircularProgress from './CircularProgress'

export default observer(function TimerDisplay() {
  const { t } = useTranslation()

  const getModeLabel = () => {
    switch (store.mode) {
      case 'focus':
        return t('focus')
      case 'shortBreak':
        return t('shortBreak')
      case 'longBreak':
        return t('longBreak')
    }
  }

  return (
    <div className="flex flex-col items-center">
      <CircularProgress progress={store.progress} mode={store.mode}>
        <div
          className={`text-5xl font-mono ${tw.text.light.primary} dark:text-gray-100`}
        >
          {store.formattedTime}
        </div>
        <div
          className={`absolute top-[66%] text-sm tracking-widest ${tw.text.light.secondary} ${tw.text.dark.tertiary} uppercase`}
        >
          {getModeLabel()}
        </div>
      </CircularProgress>
    </div>
  )
})
