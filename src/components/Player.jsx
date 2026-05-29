import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2 } from 'lucide-react'

function Player({ currentSong, isPlaying, progress, setProgress, onPlay, onPause, onNext, onPrevious }) {
  const audioRef = useRef(null)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentSong])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progressPercent = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(progressPercent)
    }
  }

  const handleSeek = (e) => {
    if (audioRef.current) {
      const seekTime = (e.target.value / 100) * audioRef.current.duration
      audioRef.current.currentTime = seekTime
      setProgress(e.target.value)
    }
  }

  const handleVolumeChange = (e) => {
    setVolume(e.target.value / 100)
    setIsMuted(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentSong) return null

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSong.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
      />
      <div className="fixed bottom-0 left-0 right-0 apple-blur border-t border-[#1a1a1a] px-4 py-2">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
          {/* Song Info */}
          <div className="flex items-center gap-2 w-56">
            <img
              src={currentSong.cover}
              alt={currentSong.title}
              className="w-8 h-8 rounded object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{currentSong.title}</p>
              <p className="text-xs text-[#8e8e93] truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex-1 max-w-xl">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={onPrevious}
                className="text-[#8e8e93] hover:text-white transition-colors"
              >
                <SkipBack size={16} />
              </button>
              <button
                onClick={isPlaying ? onPause : () => onPlay(currentSong)}
                className="w-9 h-9 tidal-accent-bg rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-[#00a8e8]/20"
              >
                {isPlaying ? (
                  <Pause size={16} className="text-white" />
                ) : (
                  <Play size={16} className="text-white ml-0.5" />
                )}
              </button>
              <button
                onClick={onNext}
                className="text-[#8e8e93] hover:text-white transition-colors"
              >
                <SkipForward size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8e8e93] w-10 text-right">
                {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="flex-1 h-1 bg-[#2a2a2a] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-[#00a8e8] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-[#00a8e8]/30"
              />
              <span className="text-xs text-[#8e8e93] w-10">
                {audioRef.current ? formatTime(audioRef.current.duration) : '0:00'}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 w-40 justify-end">
            <button
              onClick={toggleMute}
              className="text-[#8e8e93] hover:text-white transition-colors"
            >
              <Volume2 size={16} />
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-[#2a2a2a] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-[#00a8e8] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default Player
