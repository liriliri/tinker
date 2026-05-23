import { observer } from 'mobx-react-lite'
import {
  Play,
  PanelRight,
  PanelLeft,
  PanelTop,
  PanelBottom,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarSpacer,
  ToolbarSeparator,
  ToolbarButtonGroup,
  ToolbarTextButton,
  ToolbarButton,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import DarkModeSwitch from 'share/components/DarkModeSwitch'
import store from '../store'

const LAYOUT_BUTTONS = [
  { pos: 'left' as const, Icon: PanelRight },
  { pos: 'right' as const, Icon: PanelLeft },
  { pos: 'top' as const, Icon: PanelBottom },
  { pos: 'bottom' as const, Icon: PanelTop },
]

interface Props {
  onRun: () => void
}

const ToolbarComponent = observer(function ToolbarComponent({ onRun }: Props) {
  const { t } = useTranslation()

  return (
    <Toolbar className="relative">
      <ToolbarButtonGroup>
        {LAYOUT_BUTTONS.map(({ pos, Icon }, index) => (
          <ToolbarButton
            key={pos}
            variant="toggle"
            active={store.layout === pos}
            onClick={() => store.setLayout(pos)}
            className={`rounded-none ${index === 0 ? 'rounded-l' : ''} ${
              index === LAYOUT_BUTTONS.length - 1 ? 'rounded-r' : ''
            } ${
              index < LAYOUT_BUTTONS.length - 1 ? `border-r ${tw.border}` : ''
            }`}
          >
            <Icon size={14} />
          </ToolbarButton>
        ))}
      </ToolbarButtonGroup>
      <ToolbarSpacer />
      <DarkModeSwitch
        dark={store.previewDark}
        onToggle={() => {
          store.togglePreviewDark()
          onRun()
        }}
        title={t(store.previewDark ? 'darkMode' : 'lightMode')}
      />
      <ToolbarSeparator />
      <ToolbarTextButton onClick={onRun} className="flex items-center gap-1">
        <Play size={12} />
        {t('run')}
      </ToolbarTextButton>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <ToolbarButtonGroup>
          <ToolbarButton
            variant="toggle"
            active={store.showHtml}
            onClick={() => store.togglePanel('html')}
            className={`rounded-none rounded-l border-r ${tw.border} text-xs w-12 justify-center`}
          >
            HTML
          </ToolbarButton>
          <ToolbarButton
            variant="toggle"
            active={store.showCss}
            onClick={() => store.togglePanel('css')}
            className={`rounded-none border-r ${tw.border} text-xs w-12 justify-center`}
          >
            CSS
          </ToolbarButton>
          <ToolbarButton
            variant="toggle"
            active={store.showJs}
            onClick={() => store.togglePanel('js')}
            className="rounded-none rounded-r text-xs w-12 justify-center"
          >
            JS
          </ToolbarButton>
        </ToolbarButtonGroup>
      </div>
    </Toolbar>
  )
})

export default ToolbarComponent
