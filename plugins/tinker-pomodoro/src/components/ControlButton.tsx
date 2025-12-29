import { observer } from 'mobx-react-lite'
import { Play, Pause } from 'lucide-react'
import store from '../store'

export default observer(function ControlButton() {
  const handleClick = () => {
    if (store.isRunning) {
      store.pause()
    } else {
      store.start()
    }
  }

  return (
    <div className="flex justify-center my-5">
      <button
        onClick={handleClick}
        className="w-14 h-14 rounded-full border-2 border-gray-400 dark:border-gray-500
                   flex items-center justify-center transition-all duration-200
                   hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {store.isRunning ? (
          <Pause size={18} className="text-gray-700 dark:text-gray-300" />
        ) : (
          <Play size={18} className="text-gray-700 dark:text-gray-300 ml-0.5" />
        )}
      </button>
    </div>
  )
})
