export interface FileGroup {
  path: string
  matches: tinker.SearchTextResult[]
}

export interface ActiveMatch {
  path: string
  lineNumber: number
  text: string
  submatches: tinker.SearchTextSubmatch[]
}

export interface Segment {
  text: string
  matched: boolean
}
