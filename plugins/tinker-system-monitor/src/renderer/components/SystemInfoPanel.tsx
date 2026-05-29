import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import fileSize from 'licia/fileSize'
import { tw } from 'share/theme'
import store from '../store'

interface InfoCellProps {
  label: string
  value: string
}

function InfoCell({ label, value }: InfoCellProps) {
  if (!value) return null
  return (
    <div className="min-w-0">
      <div
        className={`text-[10px] font-bold uppercase tracking-wide ${tw.text.tertiary}`}
      >
        {label}
      </div>
      <div className={`text-xs ${tw.text.primary} truncate`} title={value}>
        {value}
      </div>
    </div>
  )
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0 || parts.length === 0) parts.push(`${m}m`)
  return parts.join(' ')
}

const SystemInfoPanel = observer(function SystemInfoPanel() {
  const { t } = useTranslation()
  const info = store.payload?.textMetrics
  if (!info) return null

  return (
    <div
      className={`col-span-full ${tw.bg.tertiary} ${tw.border} border rounded-lg shadow-sm px-3 py-2`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-2">
        <InfoCell label={t('cpuBrand')} value={info.cpuBrand} />
        <InfoCell label={t('os')} value={info.osDistro} />
        <InfoCell label={t('hostname')} value={info.hostname} />
        <InfoCell label={t('arch')} value={info.arch} />
        <InfoCell label={t('kernel')} value={info.kernel} />
        <InfoCell
          label={t('memoryTotal')}
          value={info.memTotal > 0 ? fileSize(info.memTotal) : ''}
        />
        <InfoCell
          label={t('swapTotal')}
          value={info.swapTotal > 0 ? fileSize(info.swapTotal) : ''}
        />
        <InfoCell
          label={t('uptime')}
          value={info.uptime > 0 ? formatUptime(info.uptime) : ''}
        />
      </div>
    </div>
  )
})

export default SystemInfoPanel
