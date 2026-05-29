import { useState } from 'react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import Player from './components/Player'
import { songs } from './data/songs'

function App() {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [view, setView] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [playlist, setPlaylist] = useState([])

  const handlePlay = (song) => {
    setCurrentSong(song)
    setIsPlaying(true)
    setProgress(0)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleNext = () => {
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id)
    const nextIndex = (currentIndex + 1) % songs.length
    setCurrentSong(songs[nextIndex])
    setProgress(0)
  }

  const handlePrevious = () => {
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id)
    const prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1
    setCurrentSong(songs[prevIndex])
    setProgress(0)
  }

  const addToPlaylist = (song) => {
    if (!playlist.find(s => s.id === song.id)) {
      setPlaylist([...playlist, song])
    }
  }

  const removeFromPlaylist = (songId) => {
    setPlaylist(playlist.filter(s => s.id !== songId))
  }

  return (
    <div className="flex h-screen bg-black relative overflow-hidden">
      {/* Top Navigation */}
      <Sidebar 
        view={view} 
        setView={setView}
        playlist={playlist}
        removeFromPlaylist={removeFromPlaylist}
      />
      <MainContent 
        view={view}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onPlay={handlePlay}
        currentSong={currentSong}
        addToPlaylist={addToPlaylist}
        playlist={playlist}
      />
      <Player 
        currentSong={currentSong}
        isPlaying={isPlaying}
        progress={progress}
        setProgress={setProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  )
}

export default App
