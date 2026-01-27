import { observer } from 'mobx-react-lite'
import { Camera } from 'lucide-react'
import store from '../store'
import { RefObject } from 'react'

interface ControlBarProps {
  videoRef: RefObject<HTMLVideoElement | null>
}

export default observer(function ControlBar({ videoRef }: ControlBarProps) {
  const handleCapture = () => {
    if (videoRef.current) {
      store.capturePhoto(videoRef.current)
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#2d2d2d] py-2 px-6">
      <div className="flex items-center justify-center">
        {/* Center capture button */}
        <button
          onClick={handleCapture}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#ff6b6b] hover:bg-[#ff5252] transition-colors shadow-lg"
        >
          <Camera size={18} className="text-white" />
        </button>
      </div>
    </div>
  )
})
