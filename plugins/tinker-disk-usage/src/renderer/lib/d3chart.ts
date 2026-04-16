import * as d3 from 'd3'
import fileSize from 'licia/fileSize'
import splitPath from 'licia/splitPath'
import type { DiskItem } from '../types'
import { THEME_COLORS } from 'share/theme'

export interface ChartCallbacks {
  onClickNode: (node: DiskItem) => void
  onExpandNode: (node: DiskItem) => void
  onContextMenuNode: (
    event: MouseEvent,
    node: DiskItem,
    isRoot: boolean
  ) => void
}

export interface ChartControls {
  render: (data: DiskItem) => void
  destroy: () => void
}

const MIN_BOX_AREA = 50
const MIN_BOX_DIM = 3
const ANIM_DURATION = 400

function shouldShow(w: number, h: number): boolean {
  return w > MIN_BOX_DIM && h > MIN_BOX_DIM && w * h > MIN_BOX_AREA
}

function getBoxColor(
  d: d3.HierarchyRectangularNode<DiskItem>,
  isDark: boolean
): string {
  if (d.data.isDirectory) {
    return isDark ? '#3a2816' : '#fcebd4'
  }

  const ext = splitPath(d.data.name).ext.toLowerCase()

  if (isDark) {
    switch (ext) {
      case '.js':
      case '.ts':
      case '.jsx':
      case '.tsx':
      case '.mjs':
      case '.cjs':
        return '#2a3a4e'
      case '.json':
      case '.yaml':
      case '.yml':
      case '.toml':
        return '#2e3d50'
      case '.css':
      case '.scss':
      case '.less':
      case '.sass':
        return '#253d4a'
      case '.html':
      case '.htm':
      case '.xml':
      case '.svg':
        return '#2b4050'
      case '.md':
      case '.txt':
      case '.log':
        return '#2d3a48'
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.ico':
      case '.webp':
        return '#33394e'
      default:
        return '#2e3848'
    }
  } else {
    switch (ext) {
      case '.js':
      case '.ts':
      case '.jsx':
      case '.tsx':
      case '.mjs':
      case '.cjs':
        return '#d4e6f7'
      case '.json':
      case '.yaml':
      case '.yml':
      case '.toml':
        return '#d0e0f0'
      case '.css':
      case '.scss':
      case '.less':
      case '.sass':
        return '#c8e0ef'
      case '.html':
      case '.htm':
      case '.xml':
      case '.svg':
        return '#cce4f5'
      case '.md':
      case '.txt':
      case '.log':
        return '#d6e8f4'
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.ico':
      case '.webp':
        return '#d2dff0'
      default:
        return '#d0e2f2'
    }
  }
}

function filterSmallChildren(
  node: d3.HierarchyRectangularNode<DiskItem>
): void {
  if (!node.children) return
  const parentArea = (node.x1 - node.x0) * (node.y1 - node.y0)
  const maxChildren = Math.max(1, Math.ceil(parentArea / 8000))

  node.children.sort((a, b) => (b.value || 0) - (a.value || 0))

  if (node.children.length > maxChildren) {
    node.children = node.children.slice(0, maxChildren)
  }

  for (const child of node.children) {
    filterSmallChildren(child)
  }
}

export function createTreemapChart(
  container: HTMLElement,
  data: DiskItem,
  callbacks: ChartCallbacks,
  isDark: boolean
): ChartControls {
  const el = container
  const d3Container = d3.select(el)
  let clickTimer: ReturnType<typeof setTimeout> | null = null

  function render(currentData: DiskItem) {
    const width = el.clientWidth
    const height = el.clientHeight
    if (width === 0 || height === 0) return

    const isFirstRender = el.childElementCount === 0
    if (isFirstRender) {
      el.classList.add('box-transition-position')
    }

    const hierarchy = d3
      .hierarchy(currentData)
      .sum((d) => (d.children && d.children.length > 0 ? 0 : d.size))
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    hierarchy.each((d) => {
      d.value = d.data.size
    })

    const root = d3
      .treemap<DiskItem>()
      .size([width, height])
      .paddingOuter(6)
      .paddingTop(22)
      .paddingInner(3)
      .round(false)(hierarchy)

    filterSmallChildren(root)
    const allowedIds = new Set(root.descendants().map((n) => n.data.id))

    const visibleNodes = root.descendants().filter((d) => {
      if (!allowedIds.has(d.data.id)) return false
      const w = d.x1 - d.x0
      const h = d.y1 - d.y0
      return shouldShow(w, h)
    })

    const fontColor = isDark
      ? THEME_COLORS.text.dark.primary
      : THEME_COLORS.text.light.primary
    const fontColorLight = isDark
      ? THEME_COLORS.text.dark.secondary
      : THEME_COLORS.text.light.secondary
    const borderColor = isDark
      ? THEME_COLORS.border.dark
      : THEME_COLORS.border.light

    d3Container
      .selectAll<HTMLDivElement, d3.HierarchyRectangularNode<DiskItem>>(
        'div.box'
      )
      .data(visibleNodes, (d) => d.data.id)
      .join(
        (enter) => {
          const entered = enter
            .append('div')
            .classed(`box ${isFirstRender ? '' : 'animate-in-box'}`, true)
            .classed('hide-box', (d) => {
              const w = d.x1 - d.x0
              const h = d.y1 - d.y0
              return !shouldShow(w, h)
            })
            .style('z-index', (d) => String(d.depth))
            .style('width', (d) => `${d.x1 - d.x0}px`)
            .style('height', (d) => `${d.y1 - d.y0}px`)
            .style('top', (d) => `${d.y0}px`)
            .style('left', (d) => `${d.x0}px`)
            .style('background-color', (d) => getBoxColor(d, isDark))
            .style('border', (d) =>
              d.depth === 0 ? 'none' : `1px solid ${borderColor}`
            )
            .style('cursor', 'default')
            .on('click', (event, d) => {
              event.stopPropagation()
              if (d.data.isDirectory && d.depth > 0) {
                if (clickTimer) clearTimeout(clickTimer)
                clickTimer = setTimeout(() => {
                  clickTimer = null
                  callbacks.onExpandNode(d.data)
                }, 300)
              }
            })
            .on('dblclick', (event, d) => {
              event.stopPropagation()
              if (clickTimer) {
                clearTimeout(clickTimer)
                clickTimer = null
              }
              if (d.depth === 0) return
              callbacks.onClickNode(d.data)
            })
            .on('contextmenu', (event, d) => {
              event.preventDefault()
              event.stopPropagation()
              callbacks.onContextMenuNode(event, d.data, d.depth === 0)
            })
            .attr(
              'title',
              (d) =>
                `${d.depth === 0 ? d.data.id : d.data.name}\n${fileSize(
                  d.value || 0
                )}`
            )

          const label = entered.append('div').attr('class', 'label')

          label
            .append('span')
            .attr('class', 'label-name')
            .style('color', fontColor)
            .text((d) => (d.depth === 0 ? d.data.id : d.data.name))

          label
            .append('span')
            .attr('class', 'label-size')
            .style('color', fontColorLight)
            .text((d) => fileSize(d.value || 0))

          return entered
        },
        (update) => {
          update
            .style('z-index', (d) => String(d.depth))
            .style('width', (d) => `${d.x1 - d.x0}px`)
            .style('height', (d) => `${d.y1 - d.y0}px`)
            .style('top', (d) => `${d.y0}px`)
            .style('left', (d) => `${d.x0}px`)
            .style('background-color', (d) => getBoxColor(d, isDark))
            .classed('hide-box', (d) => {
              const w = d.x1 - d.x0
              const h = d.y1 - d.y0
              return !shouldShow(w, h)
            })
            .attr(
              'title',
              (d) =>
                `${d.depth === 0 ? d.data.id : d.data.name}\n${fileSize(
                  d.value || 0
                )}`
            )
            .each(function (this: HTMLElement, d) {
              const nameEl = this.querySelector('.label-name') as HTMLElement
              const sizeEl = this.querySelector('.label-size') as HTMLElement
              if (nameEl) {
                nameEl.textContent = d.depth === 0 ? d.data.id : d.data.name
                nameEl.style.color = fontColor
              }
              if (sizeEl) {
                sizeEl.textContent = fileSize(d.value || 0)
                sizeEl.style.color = fontColorLight
              }
            })

          return update
        },
        (exit) => {
          exit.classed('animate-out-box', true)
          setTimeout(() => exit.remove(), ANIM_DURATION)
        }
      )
  }

  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  let lastData: DiskItem = data
  function handleResize() {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      render(lastData)
    }, 300)
  }

  window.addEventListener('resize', handleResize)
  render(data)

  function wrappedRender(newData: DiskItem) {
    lastData = newData
    render(newData)
  }

  function destroy() {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
    if (clickTimer) clearTimeout(clickTimer)
    d3Container.selectAll('div.box').remove()
    el.classList.remove('box-transition-position')
  }

  return { render: wrappedRender, destroy }
}
