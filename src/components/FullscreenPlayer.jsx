import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, AlertCircle, ChevronDown, Heart } from 'lucide-react'
import { hapticLight, hapticMedium, hapticSelection, hapticSuccess } from '../lib/haptics'
import { getCoverForSong } from '../utils/covers'

function FullscreenPlayer({ currentSong, isPlaying, progress, setProgress, onPlay, onPause, onNext, onPrevious, onClose, currentTheme, currentTime, setCurrentTime, duration, onSeek, audioRef, isLightMode, dominantColor, themeName, isMidnightBlackTheme, getMidnightBlackContrast, songs, favoriteSongs, toggleFavorite }) {
  const [imageError, setImageError] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const playerRef = useRef(null)
  const progressRef = useRef(null)
  const isSeekingRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragOffsetRef = useRef(0)
  const dragLastYRef = useRef(0)
  const dragLastTimeRef = useRef(0)
  const dragVelocityRef = useRef(0)

  // Get contrast colors for Midnight Black theme
  const isMidnightBlack = isMidnightBlackTheme && isMidnightBlackTheme(themeName)
  const contrastColors = isMidnightBlack ? getMidnightBlackContrast() : null
  
  const dragThreshold = 120
  const velocityThreshold = 600

  useEffect(() => {
    if (currentSong) {
      setIsTransitioning(true)
      const timer = setTimeout(() => setIsTransitioning(false), 300)
      return () => clearTimeout(timer)
    }
  }, [currentSong])

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleClose = () => {
    hapticSelection()
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 350)
  }

  const getSeekPercent = (clientX) => {
    if (!progressRef.current) return 0

    const rect = progressRef.current.getBoundingClientRect()
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
  }

  const seekToClientX = (clientX) => {
    const audio = audioRef?.current
    const audioDuration = audio?.duration || duration
    if (!audio || !Number.isFinite(audioDuration) || audioDuration <= 0) return

    const percent = getSeekPercent(clientX)
    const nextTime = percent * audioDuration

    audio.currentTime = nextTime
    setProgress(percent * 100)
    if (setCurrentTime) {
      setCurrentTime(nextTime)
    }
  }

  const handleProgressPointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    isSeekingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    seekToClientX(e.clientX)
  }

  const handleProgressPointerMove = (e) => {
    if (!isSeekingRef.current) return
    e.preventDefault()
    seekToClientX(e.clientX)
  }

  const endProgressSeek = (e) => {
    if (!isSeekingRef.current) return
    e.preventDefault()
    isSeekingRef.current = false
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const setPlayerDragStyle = (offset) => {
    if (!playerRef.current) return

    const dragProgress = Math.min(offset / dragThreshold, 1)
    playerRef.current.style.transform = `translateY(${offset}px)`
    playerRef.current.style.opacity = `${1 - dragProgress * 0.22}`
  }

  const resetPlayerDragStyle = () => {
    if (!playerRef.current) return

    playerRef.current.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
    playerRef.current.style.transform = 'translateY(0)'
    playerRef.current.style.opacity = '1'
  }

  const handlePlayerPointerDown = (e) => {
    if (isSeekingRef.current || e.target.closest('button, [data-progress-control]')) return

    isDraggingRef.current = true
    dragStartYRef.current = e.clientY
    dragOffsetRef.current = 0
    dragLastYRef.current = e.clientY
    dragLastTimeRef.current = performance.now()
    dragVelocityRef.current = 0
    e.currentTarget.setPointerCapture(e.pointerId)

    if (playerRef.current) {
      playerRef.current.style.transition = 'none'
    }
  }

  const handlePlayerPointerMove = (e) => {
    if (!isDraggingRef.current || isSeekingRef.current) return

    const now = performance.now()
    const deltaTime = Math.max(now - dragLastTimeRef.current, 1)
    const frameVelocity = ((e.clientY - dragLastYRef.current) / deltaTime) * 1000
    const offset = Math.max(e.clientY - dragStartYRef.current, 0)

    dragVelocityRef.current = frameVelocity
    dragLastYRef.current = e.clientY
    dragLastTimeRef.current = now
    dragOffsetRef.current = offset

    if (offset > 0) {
      e.preventDefault()
      setPlayerDragStyle(offset)
    }
  }

  const handlePlayerPointerUp = (e) => {
    if (!isDraggingRef.current) return

    isDraggingRef.current = false

    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }

    if (dragOffsetRef.current > dragThreshold || dragVelocityRef.current > velocityThreshold) {
      handleClose()
    } else {
      resetPlayerDragStyle()
    }
  }

  if (!currentSong) return null

  // Apply dominant color tint for background glow
  const getGlowColor = () => {
    if (isLightMode) {
      // Light mode: soft tinted glow
      return `${dominantColor}15` // 9% opacity
    } else {
      // Dark mode: dark tinted glow
      return `${dominantColor}25` // 15% opacity
    }
  }

  return (
    <>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          background-color: ${currentTheme.accent};
          box-shadow: 0 0 10px ${currentTheme.accent}66;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 15px ${currentTheme.accent}88;
        }
        input[type="range"]::-moz-range-thumb {
          background-color: ${currentTheme.accent};
          box-shadow: 0 0 10px ${currentTheme.accent}66;
          border: none;
        }
        input[type="range"]::-moz-range-thumb:hover {
          box-shadow: 0 0 15px ${currentTheme.accent}88;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          background: transparent;
        }
        input[type="range"]::-moz-range-track {
          background: transparent;
        }
      `}</style>
      <div 
        ref={playerRef}
        className="fixed inset-0 z-50 flex flex-col"
        onPointerDown={handlePlayerPointerDown}
        onPointerMove={handlePlayerPointerMove}
        onPointerUp={handlePlayerPointerUp}
        onPointerCancel={handlePlayerPointerUp}
        style={{
          backgroundColor: currentTheme.bg,
          animation: isClosing ? 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isClosing ? 'translateY(100%)' : 'translateY(0)',
          opacity: 1,
          transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
      >
      {/* Background with blur */}
      <div className="absolute inset-0 z-0">
        {(() => {
          const coverSrc = getCoverForSong(currentSong);
          
          console.log("FULL PLAYER BACKGROUND COVER:", coverSrc, currentSong);
          
          return imageError ? (
            <div className="w-full h-full" style={{ backgroundColor: currentTheme.surfaceLight }} />
          ) : (
            <img
              src={coverSrc}
              alt=""
              className="w-full h-full object-cover opacity-40 blur-3xl scale-125"
              onError={() => setImageError(true)}
            />
          );
        })()}
        <div className="absolute inset-0 bg-gradient-to-b" style={{
          background: isLightMode 
            ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.15))'
            : 'linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8))'
        }} />
        {/* Dynamic color glow */}
        <div 
          className="absolute inset-0 transition-colors duration-700 ease-in-out"
          style={{ backgroundColor: getGlowColor() }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-8">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 transition-all duration-150 active:scale-95"
          style={{ color: currentTheme.textMuted }}
        >
          <ChevronDown size={28} md:size={32} />
        </button>

        {/* Album Art */}
        <div className="mb-6">
          {(() => {
            const coverSrc = getCoverForSong(currentSong);
            
            console.log("FULL PLAYER COVER:", coverSrc, currentSong);
            
            return imageError ? (
              <div className="w-64 h-64 md:w-72 md:h-72 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-300" style={{ backgroundColor: currentTheme.surfaceLight, opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'scale(0.95)' : 'scale(1)' }}>
                <span className="text-lg" style={{ color: currentTheme.textMuted }}>No Cover</span>
              </div>
            ) : (
              <img
                src={coverSrc}
                alt={currentSong?.title || currentSong?.name || "Now playing"}
                className="w-64 h-64 md:w-72 md:h-72 rounded-3xl shadow-2xl transition-all duration-300 hover:scale-105"
                style={{ 
                  objectFit: 'cover',
                  objectPosition: 'center',
                  aspectRatio: '1 / 1',
                  display: 'block',
                  boxShadow: isLightMode ? '0 20px 40px -12px rgba(0, 0, 0, 0.2)' : '0 20px 40px -12px rgba(0, 0, 0, 0.5)', 
                  opacity: isTransitioning ? 0.5 : 1, 
                  transform: isTransitioning ? 'scale(0.95)' : 'scale(1)' 
                }}
                onError={(e) => {
                  e.currentTarget.src = "/covers/cover-01.jpg";
                }}
              />
            );
          })()}
        </div>

        {/* Song Info */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-xl md:text-2xl font-bold leading-tight transition-all duration-300" style={{ color: currentTheme.text, opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'translateY(-10px)' : 'translateY(0)' }}>{currentSong.title}</h1>
            <button
              onClick={() => {
                toggleFavorite(currentSong)
                hapticSuccess()
              }}
              className="flex-shrink-0 transition-all duration-200 active:scale-95"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isLightMode ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                border: isLightMode ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)',
                color: favoriteSongs?.includes(currentSong?.id || currentSong?.title)
                  ? (isLightMode ? '#ff2d55' : '#ff4d6d')
                  : (isLightMode ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.72)'),
                backdropFilter: 'blur(12px)'
              }}
            >
              <Heart 
                size={20} 
                fill={favoriteSongs?.includes(currentSong?.id || currentSong?.title) ? 'currentColor' : 'none'}
                strokeWidth={favoriteSongs?.includes(currentSong?.id || currentSong?.title) ? 0 : 2}
              />
            </button>
          </div>
          {currentSong.artist && currentSong.artist !== 'Unknown Artist' && (
            <p className="text-sm md:text-base mb-1 transition-all duration-300" style={{ color: currentTheme.textMuted, opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'translateY(-10px)' : 'translateY(0)' }}>{currentSong.artist}</p>
          )}
          {currentSong.album && currentSong.album !== 'Unknown Album' && (
            <p className="text-xs md:text-sm transition-all duration-300" style={{ color: currentTheme.textMuted, opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'translateY(-10px)' : 'translateY(0)' }}>{currentSong.album}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-2xl mb-3">
          <div
            data-progress-control
            className="progress-touch-area"
            onPointerDown={handleProgressPointerDown}
            onPointerMove={handleProgressPointerMove}
            onPointerUp={endProgressSeek}
            onPointerCancel={endProgressSeek}
            style={{ touchAction: 'none' }}
          >
            <div
              ref={progressRef}
              className="progress-track"
              style={{ backgroundColor: currentTheme.border }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${isNaN(progress) ? 0 : progress}%`,
                  backgroundColor: currentTheme.accent
                }}
              />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs md:text-sm" style={{ color: currentTheme.textMuted }}>
              {formatTime(currentTime)}
            </span>
            <span className="text-xs md:text-sm" style={{ color: currentTheme.textMuted }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 md:gap-8">
          <button
            onClick={() => {
              onPrevious()
              hapticMedium()
            }}
            className="transition-all duration-150 active:scale-90 p-2"
            style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTheme.textMuted }}
          >
            <SkipBack size={22} md:size={26} />
          </button>
          <button
            onClick={() => {
              isPlaying ? onPause() : onPlay(currentSong)
              hapticLight()
            }}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-150 shadow-2xl active:scale-95"
            style={{
              backgroundColor: isMidnightBlack ? contrastColors.playBg : currentTheme.accent,
              boxShadow: isMidnightBlack
                ? `0 0 15px ${contrastColors.playBg}66, 0 3px 8px ${isLightMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.3)'}`
                : `0 0 15px ${currentTheme.accent}66, 0 3px 8px ${isLightMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.3)'}`
            }}
          >
            {isPlaying ? (
              <Pause size={18} md:size={22} style={{ color: isMidnightBlack ? contrastColors.playIcon : (isLightMode ? '#000000' : '#FFFFFF') }} transition-all duration-150 />
            ) : (
              <Play size={18} md:size={22} style={{ color: isMidnightBlack ? contrastColors.playIcon : (isLightMode ? '#000000' : '#FFFFFF'), marginLeft: '2px' }} transition-all duration-150 />
            )}
          </button>
          <button
            onClick={() => {
              onNext()
              hapticMedium()
            }}
            className="transition-all duration-150 active:scale-90 p-2"
            style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTheme.textMuted }}
          >
            <SkipForward size={22} md:size={26} />
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

export default FullscreenPlayer
