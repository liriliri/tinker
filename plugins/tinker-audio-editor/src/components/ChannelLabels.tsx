import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

interface ChannelLabelsProps {
  timelineHeight: number
}

const ChannelLabels = observer(function ChannelLabels({
  timelineHeight,
}: ChannelLabelsProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`flex flex-col shrink-0 w-6 text-xs font-bold select-none border-r ${tw.border}`}
      style={{ paddingTop: timelineHeight }}
    >
      <button
        className={`flex-1 flex items-center justify-center transition-opacity ${
          store.leftMuted ? 'opacity-30' : tw.primary.text
        }`}
        title={t('leftChannel')}
        onClick={() => store.toggleLeftChannel()}
      >
        L
      </button>
      <button
        className={`flex-1 flex items-center justify-center transition-opacity ${
          store.rightMuted ? 'opacity-30' : tw.primary.text
        }`}
        title={t('rightChannel')}
        onClick={() => store.toggleRightChannel()}
      >
        R
      </button>
    </div>
  )
})

export default ChannelLabels
