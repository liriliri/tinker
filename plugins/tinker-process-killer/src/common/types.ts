export interface ProcessInfo {
  pid: number
  name: string
  cpu: number
  mem: number
  memRss: number
  user: string
  command?: string
  path?: string
  state?: string
  ports?: string
  icon?: string
}

export interface NetworkConnection {
  pid: number
  localPort: string
  protocol?: string
}
