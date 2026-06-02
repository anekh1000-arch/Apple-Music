import { useState, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, AlertCircle, ChevronDown } from 'lucide-react'
import { hapticLight, hapticMedium, hapticSelection } from '../lib/haptics'
import { getCoverForSong, getPlayerCoverForSong } from '../utils/covers'

function FullscreenPlayer({ currentSong, isPlaying, progress, setProgress, onPlay, onPause, onNext, onPrevious, onClose, currentTheme, currentTime, duration, onSeek, isLightMode, dominantColor, themeName, isMidnightBlackTheme, getMidnightBlackContrast, songs }) {
  const [imageError, setImageError] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Get contrast colors for Midnight Black theme
  const isMidnightBlack = isMidnightBlackTheme && isMidnightBlackTheme(themeName)
  const contrastColors = isMidnightBlack ? getMidnightBlackContrast() : null
  
  // Swipe-down gesture state
  const [touchStartY, setTouchStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const dragThreshold = 150 // pixels to trigger close

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

  // Touch event handlers for swipe-down gesture
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
    setIsDragging(true)
    setDragOffset(0)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    
    const y = e.touches[0].clientY
    setCurrentY(y)
    const offset = y - touchStartY
    
    // Only allow downward drag
    if (offset > 0) {
      setDragOffset(offset)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    setIsDragging(false)
    
    if (dragOffset > dragThreshold) {
      // Close the player
      handleClose()
    } else {
      // Snap back
      setDragOffset(0)
    }
  }

  if (!currentSong) return null

  // Calculate visual feedback during drag
  const dragProgress = Math.min(dragOffset / dragThreshold, 1)
  const scale = 1 - (dragProgress * 0.1) // Scale down to 0.9
  const opacity = 1 - (dragProgress * 0.3) // Opacity down to 0.7

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
        className="fixed inset-0 z-50 flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundColor: currentTheme.bg,
          animation: isClosing ? 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDragging ? `translateY(${dragOffset}px) scale(${scale})` : (isClosing ? 'translateY(100%)' : 'none'),
          opacity: isDragging ? opacity : 1,
          transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'none' // Prevent default touch actions
        }}
      >
      {/* Background with blur */}
      <div className="absolute inset-0 z-0">
        {(() => {
          const currentSongIndex = songs?.findIndex(s => s.id === currentSong.id || s.title === currentSong.title) ?? 0;
          const safeIndex = currentSongIndex >= 0 ? currentSongIndex : 0;
          const playerCoverSrc = getPlayerCoverForSong(currentSong, safeIndex);
          
          return imageError ? (
            <div className="w-full h-full" style={{ backgroundColor: currentTheme.surfaceLight }} />
          ) : (
            <img
              src={playerCoverSrc}
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
            const currentSongIndex = songs?.findIndex(s => s.id === currentSong.id || s.title === currentSong.title) ?? 0;
            const safeIndex = currentSongIndex >= 0 ? currentSongIndex : 0;
            const playerCoverSrc = getPlayerCoverForSong(currentSong, safeIndex);
            
            return imageError ? (
              <div className="w-64 h-64 md:w-72 md:h-72 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-300" style={{ backgroundColor: currentTheme.surfaceLight, opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'scale(0.95)' : 'scale(1)' }}>
                <span className="text-lg" style={{ color: currentTheme.textMuted }}>No Cover</span>
              </div>
            ) : (
              <img
                src={playerCoverSrc}
                alt={currentSong.title}
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
                onError={() => setImageError(true)}
              />
            );
          })()}
        </div>

        {/* Song Info */}
        <div className="text-center mb-3">
          <h1 className="text-xl md:text-2xl font-bold mb-1 leading-tight transition-all duration-300" style={{ color: currentTheme.text, opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'translateY(-10px)' : 'translateY(0)' }}>{currentSong.title}</h1>
          {currentSong.artist && currentSong.artist !== 'Unknown Artist' && (
            <p className="text-sm md:text-base mb-1 transition-all duration-300" style={{ color: currentTheme.textMuted, opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'translateY(-10px)' : 'translateY(0)' }}>{currentSong.artist}</p>
          )}
          {currentSong.album && currentSong.album !== 'Unknown Album' && (
            <p className="text-xs md:text-sm transition-all duration-300" style={{ color: currentTheme.textMuted, opacity: isTransitioning ? 0.5 : 1, transform: isTransitioning ? 'translateY(-10px)' : 'translateY(0)' }}>{currentSong.album}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-2xl mb-3">
          <input
            type="range"
            min="0"
            max="100"
            value={isNaN(progress) ? 0 : progress}
            onChange={onSeek}
            title=""
            className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:rounded-full"
            style={{
              background: `linear-gradient(to right, ${currentTheme.accent} 0%, ${currentTheme.accent} ${isNaN(progress) ? 0 : progress}%, ${currentTheme.border} ${isNaN(progress) ? 0 : progress}%, ${currentTheme.border} 100%)`
            }}
          />
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
