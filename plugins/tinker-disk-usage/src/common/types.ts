export interface DiskItem {
  id: string
  name: string
  size: number
  isDirectory: boolean
  children?: DiskItem[]
  loaded?: boolean
}
