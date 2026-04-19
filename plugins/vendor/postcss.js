import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let vendorSelectors = null

function loadVendorSelectors() {
  if (vendorSelectors) return vendorSelectors

  const cssPath = path.join(__dirname, 'dist/tailwind.css')
  const css = fs.readFileSync(cssPath, 'utf-8')
  const root = postcss.parse(css)

  vendorSelectors = new Set()

  root.walk((node) => {
    if (
      node.type === 'rule' &&
      node.parent &&
      node.parent.type === 'atrule' &&
      node.parent.name === 'layer' &&
      node.parent.params === 'utilities'
    ) {
      vendorSelectors.add(node.selector.replace(/\s+/g, ' ').trim())
    }
  })

  return vendorSelectors
}

/**
 * @type {import('postcss').PluginCreator}
 */
const plugin = () => {
  return {
    postcssPlugin: 'postcss-dedup-vendor',
    OnceExit(root) {
      const selectors = loadVendorSelectors()

      root.walk((node) => {
        if (node.type === 'atrule') {
          if (node.name === 'layer' && node.params === 'properties') {
            node.remove()
            return
          }

          if (node.name === 'layer' && node.params === 'base') {
            node.remove()
            return
          }
        }

        if (node.type === 'rule') {
          const parent = node.parent
          if (
            parent &&
            parent.type === 'atrule' &&
            parent.name === 'layer' &&
            parent.params === 'utilities'
          ) {
            const selector = node.selector.replace(/\s+/g, ' ').trim()
            if (selectors.has(selector)) {
              node.remove()
            }
          }
        }
      })

      // Remove @property and @keyframes already in vendor
      root.walk((node) => {
        if (
          node.type === 'atrule' &&
          (node.name === 'property' || node.name === 'keyframes')
        ) {
          node.remove()
        }
      })

      // Clean up empty @layer nodes
      root.walk((node) => {
        if (
          node.type === 'atrule' &&
          node.name === 'layer' &&
          node.nodes &&
          node.nodes.length === 0
        ) {
          node.remove()
        }
      })
    },
  }
}
plugin.postcss = true

export default plugin
