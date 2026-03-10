import * as htmlToImage from 'html-to-image'

const g = globalThis as Record<string, unknown>

g.htmlToImage = htmlToImage

export { htmlToImage }
