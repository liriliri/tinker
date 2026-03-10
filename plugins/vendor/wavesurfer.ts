import WaveSurfer from 'wavesurfer.js'

const g = globalThis as Record<string, unknown>

g.wavesurfer = WaveSurfer

export default WaveSurfer
