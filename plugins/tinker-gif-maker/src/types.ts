export interface GifFrame {
  id: string
  /** Object URL for the frame image (PNG) */
  url: string
  /** Delay in milliseconds */
  delay: number
  width: number
  height: number
  /** Solid fill frame created via New / blank insert */
  isBlank?: boolean
}
