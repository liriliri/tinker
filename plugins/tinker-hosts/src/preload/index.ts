import { contextBridge } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import isWindows from 'licia/isWindows'

const HOSTS_PATH = isWindows
  ? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
  : '/etc/hosts'

interface HostsConfig {
  id: string
  name: string
  content: string
}

const hostsObj = {
  // Get system hosts file path
  getHostsPath(): string {
    return HOSTS_PATH
  },

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

  // Apply hosts configuration in append mode
  applyHosts(configIds: string[], configs: HostsConfig[]): void {
    const CONTENT_START = '# --- TINKER-HOSTS_CONTENT_START ---'
    const CONTENT_END = '# --- TINKER-HOSTS_CONTENT_END ---'

    try {
      const activeConfigs = configs.filter((c) => configIds.includes(c.id))
      const mergedContent = activeConfigs.map((c) => c.content).join('\n\n')

      // Read current hosts
      const currentHosts = hostsObj.readSystemHosts()
      const startIndex = currentHosts.indexOf(CONTENT_START)
      const endIndex = currentHosts.indexOf(CONTENT_END)

      let beforeContent = ''
      let afterContent = ''

      if (startIndex > -1 && endIndex > startIndex) {
        // Both markers exist, extract content before START and after END
        beforeContent = currentHosts.substring(0, startIndex).trimEnd()
        afterContent = currentHosts
          .substring(endIndex + CONTENT_END.length)
          .trimStart()
      } else if (startIndex > -1) {
        // Only START marker exists (old format), preserve content before it
        beforeContent = currentHosts.substring(0, startIndex).trimEnd()
        afterContent = ''
      } else {
        // No markers, treat entire file as before content
        beforeContent = currentHosts.trimEnd()
        afterContent = ''
      }

      // If no active configs or content is empty, remove tinker-hosts section
      if (activeConfigs.length === 0 || mergedContent.trim().length === 0) {
        const finalContent =
          afterContent.length > 0
            ? `${beforeContent}\n\n${afterContent}`
            : beforeContent
        hostsObj.writeSystemHosts(finalContent)
        return
      }

      // Build final content with markers
      const tinkerSection = `${CONTENT_START}\n\n${mergedContent}\n\n${CONTENT_END}`
      const parts = [beforeContent, tinkerSection]
      if (afterContent.length > 0) {
        parts.push(afterContent)
      }

      const finalContent = parts.join('\n\n')
      hostsObj.writeSystemHosts(finalContent)
    } catch (error) {
      console.error('Failed to apply hosts:', error)
      throw error
    }
  },

  // Write file to specified path
  writeFile(filePath: string, content: string): void {
    try {
      writeFileSync(filePath, content, 'utf-8')
    } catch (error) {
      console.error('Failed to write file:', error)
      throw new Error('Failed to write file.')
    }
  },
}

contextBridge.exposeInMainWorld('hosts', hostsObj)

declare global {
  const hosts: typeof hostsObj
}
