export interface HostsConfig {
  id: string
  name: string
  content: string
  group: 'common' | 'custom'
}

export interface AppConfig {
  configs: HostsConfig[]
  activeIds: string[]
}

export type ViewMode = 'system' | 'config'
