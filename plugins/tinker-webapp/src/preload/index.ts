import { contextBridge } from 'electron'
import http, { type IncomingMessage } from 'http'
import https from 'https'
import fs from 'fs-extra'
import path from 'path'
import escapeRegExp from 'licia/escapeRegExp'
import isEmpty from 'licia/isEmpty'
import isUrl from 'licia/isUrl'
import isWindows from 'licia/isWindows'
import kebabCase from 'licia/kebabCase'
import lowerCase from 'licia/lowerCase'
import md5 from 'licia/md5'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import { collectIconUrls, extForIcon, isImagePayload } from './favicon'
import {
  isPluginCategory,
  PLUGIN_PREFIX,
  type PluginCategory,
  type WebApp,
  type WebAppInput,
} from '../common/types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
const MAX_HTML_BYTES = 512 * 1024
const MAX_ICON_BYTES = 2 * 1024 * 1024

const ID_RE = new RegExp(
  `^${escapeRegExp(PLUGIN_PREFIX)}[a-z0-9]+(?:-[a-z0-9]+)*$`
)

async function resolveModulesDir(): Promise<string> {
  const userData = await tinker.getPath('userData')
  return isWindows
    ? path.join(userData, 'plugins', 'node_modules')
    : path.join(userData, 'plugins', 'lib', 'node_modules')
}

/** Derive id slug from name only; empty when name has no latin/digit chars (e.g. Chinese). */
function nameToSlug(name: string): string {
  return lowerCase(kebabCase(name))
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeUrl(url: string): string {
  const value = trim(url)
  if (isEmpty(value)) {
    throw new Error('URL is required')
  }
  const lower = lowerCase(value)
  const withProtocol =
    startWith(lower, 'http://') || startWith(lower, 'https://')
      ? value
      : `https://${value}`
  if (!isUrl(withProtocol)) {
    throw new Error('URL must start with http:// or https://')
  }
  const parsed = new URL(withProtocol)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must start with http:// or https://')
  }
  return parsed.toString()
}

function normalizeId(id: string): string {
  let value = lowerCase(trim(id))
  if (isEmpty(value)) {
    throw new Error('Plugin id is required')
  }
  if (!startWith(value, PLUGIN_PREFIX)) {
    value = PLUGIN_PREFIX + value
  }
  if (!ID_RE.test(value)) {
    throw new Error(
      'Plugin id may only contain lowercase letters, numbers and hyphens'
    )
  }
  return value
}

function normalizeCategory(category: unknown): PluginCategory {
  if (isPluginCategory(category)) return category
  return 'productivity'
}

function normalizeInput(input: WebAppInput) {
  const name = trim(input.name)
  if (isEmpty(name)) throw new Error('Name is required')
  return {
    name,
    url: normalizeUrl(input.url),
    description: trim(input.description || ''),
    category: normalizeCategory(input.category),
  }
}

async function readWebApp(dir: string): Promise<WebApp | null> {
  const pkgPath = path.join(dir, 'package.json')
  if (!(await fs.pathExists(pkgPath))) return null

  try {
    const pkg = await fs.readJson(pkgPath)
    if (!pkg?.tinker?.main || !startWith(pkg.tinker.main, 'http')) {
      return null
    }
    const id = pkg.name as string
    if (!startWith(id, PLUGIN_PREFIX)) return null

    const iconPath = path.join(dir, pkg.tinker.icon || 'icon.png')
    return {
      id,
      name: pkg.tinker.name || id,
      url: pkg.tinker.main,
      description: pkg.tinker.description || pkg.description || '',
      category: normalizeCategory(pkg.tinker.category),
      icon: (await fs.pathExists(iconPath)) ? iconPath : '',
    }
  } catch {
    return null
  }
}

async function copyIcon(
  pluginDir: string,
  iconPath: string
): Promise<string | undefined> {
  if (!(await fs.pathExists(iconPath))) return undefined
  const ext = path.extname(iconPath).toLowerCase() || '.png'
  const fileName = `icon${ext === '.jpeg' ? '.jpg' : ext}`
  const dest = path.join(pluginDir, fileName)
  if (path.resolve(iconPath) === path.resolve(dest)) {
    return fileName
  }
  await fs.copy(iconPath, dest)
  return fileName
}

async function existingIconFile(
  pluginDir: string
): Promise<string | undefined> {
  const names = [
    'icon.png',
    'icon.ico',
    'icon.jpg',
    'icon.jpeg',
    'icon.webp',
    'icon.gif',
    'icon.svg',
  ]
  for (const name of names) {
    if (await fs.pathExists(path.join(pluginDir, name))) return name
  }
  return undefined
}

interface PackageFields {
  id: string
  name: string
  url: string
  description: string
  category: PluginCategory
  icon?: string
}

async function writePackage(pluginDir: string, app: PackageFields) {
  const pkg = {
    name: app.id,
    version: '0.1.0',
    description: app.description || `${app.name} plugin for TINKER`,
    tinker: {
      name: app.name,
      main: app.url,
      category: app.category,
      ...(app.description ? { description: app.description } : {}),
      ...(app.icon ? { icon: app.icon } : {}),
    },
    keywords: ['tinker'],
  }
  await fs.writeJson(path.join(pluginDir, 'package.json'), pkg, { spaces: 2 })
}

function fetchBuffer(
  url: string,
  maxBytes: number,
  redirects = 5
): Promise<{ data: Buffer; contentType: string; finalUrl: string }> {
  return new Promise((resolve, reject) => {
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      reject(new Error(`Invalid URL: ${url}`))
      return
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      reject(new Error('Unsupported protocol'))
      return
    }

    const options = {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 10000,
    }

    const req =
      parsed.protocol === 'https:'
        ? https.get(url, options, handleResponse)
        : http.get(url, options, handleResponse)

    function handleResponse(res: IncomingMessage) {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        res.resume()
        if (redirects <= 0) {
          reject(new Error('Too many redirects'))
          return
        }
        const redirectUrl = new URL(res.headers.location, url).href
        fetchBuffer(redirectUrl, maxBytes, redirects - 1).then(resolve, reject)
        return
      }

      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        res.resume()
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }

      const chunks: Buffer[] = []
      let total = 0
      res.on('data', (chunk: Buffer) => {
        total += chunk.length
        if (total > maxBytes) {
          req.destroy()
          reject(new Error('Response too large'))
          return
        }
        chunks.push(chunk)
      })
      res.on('end', () => {
        resolve({
          data: Buffer.concat(chunks),
          contentType: res.headers['content-type'] || '',
          finalUrl: url,
        })
      })
      res.on('error', reject)
    }

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Timeout'))
    })
  })
}

async function saveTempIcon(
  data: Buffer,
  contentType: string,
  sourceUrl: string
): Promise<string> {
  const tempRoot = await tinker.getPath('temp')
  const dir = path.join(tempRoot, 'tinker-webapp-icons')
  await fs.mkdirs(dir)
  const filePath = path.join(
    dir,
    `${md5(sourceUrl)}${extForIcon(contentType, sourceUrl)}`
  )
  await fs.writeFile(filePath, data)
  return filePath
}

async function downloadIcon(iconUrl: string): Promise<string | null> {
  const { data, contentType } = await fetchBuffer(iconUrl, MAX_ICON_BYTES)
  if (!isImagePayload(contentType, data)) return null
  return saveTempIcon(data, contentType, iconUrl)
}

const api = {
  suggestSlug(name: string): string {
    return nameToSlug(name)
  },

  /** Fetch page HTML, parse favicon links, download best match to a temp file. */
  async fetchIcon(pageUrl: string): Promise<string> {
    let normalized: string
    try {
      normalized = normalizeUrl(pageUrl)
    } catch {
      return ''
    }

    let iconUrls: string[]
    try {
      const page = await fetchBuffer(normalized, MAX_HTML_BYTES)
      const pageType = lowerCase(page.contentType.split(';')[0] || '')
      if (startWith(pageType, 'image/')) {
        if (!isImagePayload(page.contentType, page.data)) return ''
        return saveTempIcon(page.data, page.contentType, page.finalUrl)
      }
      iconUrls = collectIconUrls(page.data.toString('utf8'), page.finalUrl)
    } catch {
      // Page HTML unavailable — still try the conventional favicon path
      try {
        iconUrls = [new URL('/favicon.ico', normalized).href]
      } catch {
        return ''
      }
    }

    for (const iconUrl of iconUrls) {
      try {
        const filePath = await downloadIcon(iconUrl)
        if (filePath) return filePath
      } catch {
        // continue with remaining candidates
      }
    }
    return ''
  },

  async list(): Promise<WebApp[]> {
    const modulesDir = await resolveModulesDir()
    if (!(await fs.pathExists(modulesDir))) return []

    const entries = await fs.readdir(modulesDir, { withFileTypes: true })
    const apps: WebApp[] = []

    for (const entry of entries) {
      if (!startWith(entry.name, PLUGIN_PREFIX)) continue
      const fullPath = path.join(modulesDir, entry.name)
      let isDir = entry.isDirectory()
      if (entry.isSymbolicLink()) {
        try {
          isDir = (await fs.stat(fullPath)).isDirectory()
        } catch {
          continue
        }
      }
      if (!isDir) continue
      const app = await readWebApp(fullPath)
      if (app) apps.push(app)
    }

    return apps.sort((a, b) => a.name.localeCompare(b.name))
  },

  async create(input: WebAppInput): Promise<WebApp> {
    const { name, url, description, category } = normalizeInput(input)
    const id = normalizeId(input.id || nameToSlug(name))

    const modulesDir = await resolveModulesDir()
    await fs.mkdirs(modulesDir)

    const pluginDir = path.join(modulesDir, id)
    if (await fs.pathExists(pluginDir)) {
      throw new Error(`Plugin id already exists: ${id}`)
    }
    await fs.mkdirs(pluginDir)

    const icon = input.iconPath
      ? await copyIcon(pluginDir, input.iconPath)
      : undefined
    await writePackage(pluginDir, {
      id,
      name,
      url,
      description,
      category,
      icon,
    })

    const app = await readWebApp(pluginDir)
    if (!app) throw new Error('Failed to create web app')
    return app
  },

  async update(id: string, input: WebAppInput): Promise<WebApp> {
    if (!startWith(id, PLUGIN_PREFIX)) {
      throw new Error('Invalid web app id')
    }
    const { name, url, description, category } = normalizeInput(input)

    const modulesDir = await resolveModulesDir()
    const pluginDir = path.join(modulesDir, id)
    if (!(await fs.pathExists(pluginDir))) {
      throw new Error('Web app not found')
    }

    let icon: string | undefined
    if (input.iconPath) {
      icon = await copyIcon(pluginDir, input.iconPath)
    } else {
      const existing = await existingIconFile(pluginDir)
      if (existing) {
        await fs.remove(path.join(pluginDir, existing))
      }
    }

    await writePackage(pluginDir, {
      id,
      name,
      url,
      description,
      category,
      icon,
    })

    const app = await readWebApp(pluginDir)
    if (!app) throw new Error('Failed to update web app')
    return app
  },

  async remove(id: string): Promise<void> {
    if (!startWith(id, PLUGIN_PREFIX)) {
      throw new Error('Invalid web app id')
    }
    const modulesDir = await resolveModulesDir()
    const pluginDir = path.join(modulesDir, id)
    if (await fs.pathExists(pluginDir)) {
      await fs.remove(pluginDir)
    }
  },
}

contextBridge.exposeInMainWorld('webapp', api)

declare global {
  const webapp: typeof api
}
