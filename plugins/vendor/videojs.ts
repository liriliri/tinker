import * as videojsReact from '@videojs/react'
import * as videojsReactVideo from '@videojs/react/video'
import '@videojs/react/video/skin.css'
import { expose } from './util'

expose({
  videojsReact,
  videojsReactVideo,
})

export { videojsReact, videojsReactVideo }
