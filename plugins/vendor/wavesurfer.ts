import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/plugins/regions'

const g = globalThis as Record<string, unknown>

g.wavesurfer = WaveSurfer
g.wavesurferRegionsPlugin = RegionsPlugin

export default WaveSurfer
export { RegionsPlugin }
