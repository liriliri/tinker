import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from './store'
import AnalogClock from './components/AnalogClock'
import DigitalClock from './components/DigitalClock'
import FlipClock from './components/FlipClock'

export default observer(function App() {
  const { t } = useTranslation()

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()

    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('flipClock'),
        type: 'checkbox',
        checked: store.theme === 'flip',
        click: () => store.setTheme('flip'),
      },
      {
        label: t('analogClock'),
        type: 'checkbox',
        checked: store.theme === 'analog',
        click: () => store.setTheme('analog'),
      },
      {
        label: t('digitalClock'),
        type: 'checkbox',
        checked: store.theme === 'digital',
        click: () => store.setTheme('digital'),
      },
      {
        type: 'separator',
      },
      {
        label: t('timezone'),
        submenu: [
          {
            label: t('local'),
            type: 'radio',
            checked: store.timezone === 'local',
            click: () => store.setTimezone('local'),
          },
          {
            label: t('utc'),
            type: 'radio',
            checked: store.timezone === 'UTC',
            click: () => store.setTimezone('UTC'),
          },
          {
            label: t('newYork'),
            type: 'radio',
            checked: store.timezone === 'America/New_York',
            click: () => store.setTimezone('America/New_York'),
          },
          {
            label: t('london'),
            type: 'radio',
            checked: store.timezone === 'Europe/London',
            click: () => store.setTimezone('Europe/London'),
          },
          {
            label: t('paris'),
            type: 'radio',
            checked: store.timezone === 'Europe/Paris',
            click: () => store.setTimezone('Europe/Paris'),
          },
          {
            label: t('dubai'),
            type: 'radio',
            checked: store.timezone === 'Asia/Dubai',
            click: () => store.setTimezone('Asia/Dubai'),
          },
          {
            label: t('beijing'),
            type: 'radio',
            checked: store.timezone === 'Asia/Shanghai',
            click: () => store.setTimezone('Asia/Shanghai'),
          },
          {
            label: t('tokyo'),
            type: 'radio',
            checked: store.timezone === 'Asia/Tokyo',
            click: () => store.setTimezone('Asia/Tokyo'),
          },
          {
            label: t('sydney'),
            type: 'radio',
            checked: store.timezone === 'Australia/Sydney',
            click: () => store.setTimezone('Australia/Sydney'),
          },
        ],
      },
    ])
  }

  return (
    <div
      className={`h-screen flex items-center justify-center transition-colors ${tw.bg.secondary}`}
      onContextMenu={handleContextMenu}
    >
      {store.theme === 'flip' ? (
        <FlipClock />
      ) : store.theme === 'analog' ? (
        <AnalogClock />
      ) : (
        <DigitalClock />
      )}
    </div>
  )
})
