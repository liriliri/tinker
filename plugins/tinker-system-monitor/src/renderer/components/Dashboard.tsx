import { useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { DASHBOARD_METRICS } from '../lib/metricDisplay'
import { useGridMinColumn } from '../lib/useGridMinColumn'
import store from '../store'
import DiskMountCard from './DiskMountCard'
import MetricPanel from './MetricPanel'

const Dashboard = observer(function Dashboard() {
  const gridRef = useRef<HTMLDivElement>(null)
  const minCol = useGridMinColumn(gridRef)
  const disks = store.payload?.textMetrics.diskSpace ?? []

  return (
    <div
      ref={gridRef}
      className="grid gap-x-2 gap-y-3"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))`,
      }}
    >
      {DASHBOARD_METRICS.map((id) => (
        <MetricPanel key={id} id={id} />
      ))}
      {disks.map((disk) => (
        <DiskMountCard key={disk.mount} disk={disk} />
      ))}
    </div>
  )
})

export default Dashboard
