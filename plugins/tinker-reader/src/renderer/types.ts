export interface Book {
  id: string
  path: string
  title: string
  fileSize: number
  numPages: number
  coverDataUrl: string | null
  addedAt: number
  lastOpenedAt: number
  lastPage: number
}
