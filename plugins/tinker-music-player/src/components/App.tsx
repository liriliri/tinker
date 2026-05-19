import { observer } from 'mobx-react-lite'
import PlayerBar from './PlayerBar'
import Playlist from './Playlist'
import MusicToolbar from './Toolbar'

const App = observer(() => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <MusicToolbar />
      <div className="flex-1 overflow-hidden">
        <Playlist />
      </div>
      <PlayerBar />
    </div>
  )
})

export default App
