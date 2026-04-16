import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/plugins/regions'
import TimelinePlugin from 'wavesurfer.js/plugins/timeline'
import { expose } from './util'

expose({
  wavesurfer: WaveSurfer,
  wavesurferRegionsPlugin: RegionsPlugin,
  wavesurferTimelinePlugin: TimelinePlugin,
})

export default WaveSurfer
export { RegionsPlugin, TimelinePlugin }
