import lamejs from 'lamejs'
import MPEGMode from 'lamejs/src/js/MPEGMode'
import Lame from 'lamejs/src/js/Lame'
import BitStream from 'lamejs/src/js/BitStream'

// Expose globals required by lamejs when bundled
;(window as any).MPEGMode = MPEGMode
;(window as any).Lame = Lame
;(window as any).BitStream = BitStream

export async function convertToMp3(audioBlob: Blob): Promise<Blob> {
  const audioContext = new AudioContext()
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  const channels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const kbps = 128

  // Create encoder
  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps)
  const mp3Data: BlobPart[] = []

  const sampleBlockSize = 1152

  if (channels === 1) {
    // Mono
    const samples = convertFloat32ToInt16(audioBuffer.getChannelData(0))
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize)
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk)
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf)
      }
    }
  } else {
    // Stereo
    const left = convertFloat32ToInt16(audioBuffer.getChannelData(0))
    const right = convertFloat32ToInt16(audioBuffer.getChannelData(1))
    for (let i = 0; i < left.length; i += sampleBlockSize) {
      const leftChunk = left.subarray(i, i + sampleBlockSize)
      const rightChunk = right.subarray(i, i + sampleBlockSize)
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk)
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf)
      }
    }
  }

  // Flush encoder
  const mp3buf = mp3encoder.flush()
  if (mp3buf.length > 0) {
    mp3Data.push(new Int8Array(mp3buf))
  }

  // Create blob
  const blob = new Blob(mp3Data, { type: 'audio/mp3' })
  return blob
}

function convertFloat32ToInt16(buffer: Float32Array): Int16Array {
  const int16 = new Int16Array(buffer.length)
  for (let i = 0; i < buffer.length; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]))
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return int16
}
