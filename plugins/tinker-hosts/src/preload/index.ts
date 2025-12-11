import { contextBridge } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { homedir, platform } from 'os'
import { join } from 'path'

const HOSTS_PATH =
  platform() === 'win32'
    ? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
    : '/etc/hosts'

const CONFIG_DIR = join(homedir(), '.tinker-hosts')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

interface HostsConfig {
  id: string
  name: string
  content: string
  group: 'common' | 'custom'
}

interface AppConfig {
  configs: HostsConfig[]
  activeIds: string[]
}

const hostsObj = {
  // Read system hosts file
  readSystemHosts(): string {
    try {
      return readFileSync(HOSTS_PATH, 'utf-8')
    } catch (error) {
      console.error('Failed to read hosts file:', error)
      throw new Error(
        'Failed to read hosts file. Please run with administrator privileges.'
      )
    }
  },

  // Write to system hosts file
  writeSystemHosts(content: string): void {
    try {
      writeFileSync(HOSTS_PATH, content, 'utf-8')
    } catch (error) {
      console.error('Failed to write hosts file:', error)
      throw new Error(
        'Failed to write hosts file. Please run with administrator privileges.'
      )
    }
  },

  // Load app configuration
  loadConfig(): AppConfig {
    try {
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true })
      }

      if (!existsSync(CONFIG_FILE)) {
        const defaultConfig: AppConfig = {
          configs: [
            {
              id: 'common',
              name: '公共配置',
              content: '',
              group: 'common',
            },
          ],
          activeIds: ['common'],
        }
        writeFileSync(
          CONFIG_FILE,
          JSON.stringify(defaultConfig, null, 2),
          'utf-8'
        )
        return defaultConfig
      }

      const content = readFileSync(CONFIG_FILE, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to load config:', error)
      throw new Error('Failed to load configuration')
    }
  },

  // Save app configuration
  saveConfig(config: AppConfig): void {
    try {
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true })
      }
      writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to save config:', error)
      throw new Error('Failed to save configuration')
    }
  },

  // Apply hosts configuration
  applyHosts(configIds: string[], configs: HostsConfig[]): void {
    try {
      const activeConfigs = configs.filter((c) => configIds.includes(c.id))

      if (activeConfigs.length === 0) {
        throw new Error('No active configurations selected')
      }

      const mergedContent = activeConfigs.map((c) => c.content).join('\n\n')

      if (mergedContent.trim().length === 0) {
        throw new Error('Active configurations are empty')
      }

      hostsObj.writeSystemHosts(mergedContent)
    } catch (error) {
      console.error('Failed to apply hosts:', error)
      throw error
    }
  },
}

contextBridge.exposeInMainWorld('hosts', hostsObj)

declare global {
  interface Window {
    hosts: typeof hostsObj
  }
}
