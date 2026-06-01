import { useEffect, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, AlertCircle } from 'lucide-react'
import { hapticMedium } from '../lib/haptics'

function Player({ currentSong, isPlaying, progress, setProgress, onPlay, onPause, onNext, onPrevious, onOpenFullscreen, currentTheme, audioRef, currentTime, duration, onSeek, onTimeUpdate, isLightMode, dominantColor, themeName, isMidnightBlackTheme, getMidnightBlackContrast }) {
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [audioError, setAudioError] = useState(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Reset error and loading state when song changes
  useEffect(() => {
    if (currentSong) {
      setAudioError(null)
      setIsLoading(true)
      setImageError(false)
    }
  }, [currentSong])

  const [isTransitioning, setIsTransitioning] = useState(false)

  // Get contrast colors for Midnight Black theme
  const isMidnightBlack = isMidnightBlackTheme && isMidnightBlackTheme(themeName)
  const contrastColors = isMidnightBlack ? getMidnightBlackContrast() : null

  useEffect(() => {
    if (currentSong) {
      setIsTransitioning(true)
      const timer = setTimeout(() => setIsTransitioning(false), 300)
      return () => clearTimeout(timer)
    }
  }, [currentSong])

  const handleLoadStart = () => {
    setIsLoading(true)
    setAudioError(null)
  }

  const handleCanPlay = () => {
    setIsLoading(false)
    setAudioError(null)
  }

  const handleError = (e) => {
    console.error('Audio loading error:', currentSong?.audioUrl)
    setAudioError('Failed to load audio')
    setIsLoading(false)
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

  // Calculate subtle accent color for mini player
  const getAccentColor = () => {
    if (isLightMode) {
      return `${dominantColor}20` // 12.5% opacity for light mode
    } else {
      return `${dominantColor}30` // 19% opacity for dark mode
    }
  }

  return (
    <>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          background-color: ${isLightMode ? '#111111' : '#8B5CF6'};
          box-shadow: 0 0 10px ${isLightMode ? 'rgba(17, 17, 17, 0.3)' : 'rgba(139, 92, 246, 0.5)'};
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 15px ${isLightMode ? 'rgba(17, 17, 17, 0.5)' : 'rgba(139, 92, 246, 0.7)'};
        }
        input[type="range"]::-moz-range-thumb {
          background-color: ${isLightMode ? '#111111' : '#8B5CF6'};
          box-shadow: 0 0 10px ${isLightMode ? 'rgba(17, 17, 17, 0.3)' : 'rgba(139, 92, 246, 0.5)'};
          border: none;
        }
        input[type="range"]::-moz-range-thumb:hover {
          box-shadow: 0 0 15px ${isLightMode ? 'rgba(17, 17, 17, 0.5)' : 'rgba(139, 92, 246, 0.7)'};
        }
        input[type="range"]::-webkit-slider-runnable-track {
          background: transparent;
        }
        input[type="range"]::-moz-range-track {
          background: transparent;
        }
      `}</style>
      <div 
        className="fixed bottom-16 md:bottom-0 left-0 right-0 backdrop-blur-xl px-4 py-3 md:py-3 z-20"
        style={{
          backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.94)' : 'rgba(5, 5, 5, 0.94)',
          borderTop: isLightMode ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(18px)'
        }}
        onClick={(e) => {
          // Only open fullscreen if not clicking on control buttons
          if (!e.target.closest('button')) {
            onOpenFullscreen()
          }
        }}
      >
        <div className="max-w-screen-2xl mx-auto flex items-center gap-3 md:gap-4">
          {/* Album Cover - Left */}
          <div 
            className="flex-shrink-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onOpenFullscreen()
            }}
          >
            {imageError ? (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300" style={{ backgroundColor: isLightMode ? '#E5E7EB' : '#121212', opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'scale(0.95)' : 'scale(1)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: isLightMode ? '#6E6E73' : '#71717A' }}>
                  <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ) : (
              <img
                src={currentSong.cover}
                alt={currentSong.title}
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover shadow-lg transition-all duration-300"
                style={{ opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'scale(0.95)' : 'scale(1)' }}
                onError={() => setImageError(true)}
              />
            )}
          </div>

          {/* Song Info - Center */}
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base font-semibold truncate transition-all duration-300" style={{ color: isLightMode ? '#111111' : '#FFFFFF', opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'translateX(-10px)' : 'translateX(0)' }}>{currentSong.title}</p>
            {currentSong.artist && currentSong.artist !== 'Unknown Artist' && (
              <p className="text-xs md:text-sm truncate transition-all duration-300" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA', opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'translateX(-10px)' : 'translateX(0)' }}>{currentSong.artist}</p>
            )}
          </div>

          {/* Controls - Right */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPrevious()
                hapticMedium()
              }}
              className="transition-colors p-1.5 md:p-2"
              style={{ color: currentTheme.textMuted }}
            >
              <SkipBack size={18} md:size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                isPlaying ? onPause() : onPlay(currentSong)
                hapticMedium()
              }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-150 shadow-lg active:scale-95 flex-shrink-0"
              style={{
                backgroundColor: isMidnightBlack ? contrastColors.playBg : currentTheme.accent,
                boxShadow: isMidnightBlack
                  ? `0 0 20px ${contrastColors.playBg}66, 0 4px 12px ${isLightMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.3)'}`
                  : `0 0 20px ${currentTheme.accent}66, 0 4px 12px ${isLightMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.3)'}`
              }}
            >
              {isPlaying ? (
                <Pause size={16} md:size={20} style={{ color: isMidnightBlack ? contrastColors.playIcon : (isLightMode ? '#000000' : '#FFFFFF') }} transition-all duration-150 />
              ) : (
                <Play size={16} md:size={20} style={{ color: isMidnightBlack ? contrastColors.playIcon : (isLightMode ? '#000000' : '#FFFFFF'), marginLeft: '2px' }} transition-all duration-150 />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNext()
                hapticMedium()
              }}
              className="transition-colors p-1.5 md:p-2"
              style={{ color: currentTheme.textMuted }}
            >
              <SkipForward size={18} md:size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Player
