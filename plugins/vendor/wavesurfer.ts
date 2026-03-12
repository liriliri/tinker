import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/plugins/regions'
import TimelinePlugin from 'wavesurfer.js/plugins/timeline'

const g = globalThis as Record<string, unknown>

g.wavesurfer = WaveSurfer
g.wavesurferRegionsPlugin = RegionsPlugin
g.wavesurferTimelinePlugin = TimelinePlugin

export default WaveSurfer
export { RegionsPlugin, TimelinePlugin }
