import * as kdbxweb from 'kdbxweb'

export type KdbxEntry = {
  uuid: string
  title: string
  username: string
  password: kdbxweb.ProtectedValue
  url: string
  notes: string
  icon: number
  tags: string[]
  customFields: Map<string, any>
  times: {
    creationTime: Date
    lastModTime: Date
    lastAccessTime: Date
    expiryTime: Date | null
    expires: boolean
  }
}

export type KdbxGroup = {
  uuid: string
  name: string
  icon: number
  entries: KdbxEntry[]
  groups: KdbxGroup[]
}
