import { Fragment, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import contain from 'licia/contain'
import { DASHBOARD_SECTIONS } from '../lib/metricDisplay'
import { useGridMinColumn } from '../lib/useGridMinColumn'
import store from '../store'
import DiskMountCard from './DiskMountCard'
import MetricPanel from './MetricPanel'
import SectionDivider from './SectionDivider'
import SystemInfoPanel from './SystemInfoPanel'

const Dashboard = observer(function Dashboard() {
  const gridRef = useRef<HTMLDivElement>(null)
  const minCol = useGridMinColumn(gridRef)
  const unavailable = store.payload?.unavailableMetrics ?? []
  const disks = store.payload?.textMetrics.diskSpace ?? []

  return (
    <div
      ref={gridRef}
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))`,
      }}
    >
      <SystemInfoPanel />

      {DASHBOARD_SECTIONS.map((section) => {
        const visible = section.metrics.filter(
          (id) => !contain(unavailable, id)
        )
        if (visible.length === 0) return null

        return (
          <Fragment key={section.labelKey}>
            <SectionDivider labelKey={section.labelKey} />
            {visible.map((id) => (
              <MetricPanel key={id} id={id} />
            ))}
          </Fragment>
        )
      })}

      {disks.length > 0 && (
        <Fragment key="disk-mounts">
          <SectionDivider labelKey="sectionDiskMounts" />
          {disks.map((disk) => (
            <DiskMountCard key={disk.mount} disk={disk} />
          ))}
        </Fragment>
      )}
    </div>
  )
})

export default Dashboard
