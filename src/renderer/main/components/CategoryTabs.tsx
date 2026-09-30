import { observer } from 'mobx-react-lite'
import { useLayoutEffect, useRef, useState } from 'react'
import { PLUGIN_CATEGORIES, PluginCategoryFilter } from 'common/types'
import { t } from 'common/util'
import capitalize from 'licia/capitalize'
import map from 'licia/map'
import store from '../store'
import Style from './CategoryTabs.module.scss'

export default observer(function CategoryTabs() {
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<
    Partial<Record<PluginCategoryFilter, HTMLButtonElement>>
  >({})
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    ready: false,
  })

  const tabs: PluginCategoryFilter[] = store.searchLocalApps
    ? ['all', 'apps', ...PLUGIN_CATEGORIES]
    : ['all', ...PLUGIN_CATEGORIES]

  const updateIndicator = () => {
    const tab = tabRefs.current[store.category]
    if (!tab) return

    setIndicator({
      left: tab.offsetLeft,
      width: tab.offsetWidth,
      ready: true,
    })
  }

  useLayoutEffect(() => {
    if (!store.showCategoryTabs) return

    updateIndicator()

    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => updateIndicator())
    observer.observe(container)
    return () => observer.disconnect()
  }, [store.category, store.showCategoryTabs, store.searchLocalApps])

  if (!store.showCategoryTabs) {
    return null
  }

  return (
    <div className={Style.wrapper}>
      <div className={Style.container} ref={containerRef}>
        <div
          className={`${Style.indicator}${
            indicator.ready ? ` ${Style.ready}` : ''
          }`}
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
          }}
        />
        {map(tabs, (id) => (
          <button
            key={id}
            type="button"
            ref={(el) => {
              if (el) {
                tabRefs.current[id] = el
              } else {
                delete tabRefs.current[id]
              }
            }}
            className={`${Style.tab}${
              store.category === id ? ` ${Style.active}` : ''
            }`}
            onClick={() => store.setCategory(id)}
          >
            {t(`category${capitalize(id)}`)}
          </button>
        ))}
      </div>
    </div>
  )
})
