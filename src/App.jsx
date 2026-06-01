import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import Player from './components/Player'
import FullscreenPlayer from './components/FullscreenPlayer'
import SplashScreen from './components/SplashScreen'
import { songs } from './data/songs'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { extractDominantColor } from './lib/extractColor'
import { hapticLight } from './lib/haptics'

// Theme definitions
const themes = {
  'midnight-black': {
    accent: '#E5E7EB',
    accentHover: '#D1D5DB',
    bg: '#000000',
    surface: '#0f0f0f',
    surfaceLight: '#1a1a1a',
    border: '#1a1a1a',
    borderLight: '#2a2a2a',
    text: '#ffffff',
    textMuted: '#9ca3af'
  },
  'forest-noir': {
    accent: '#14532D',
    accentHover: '#166534',
    bg: '#050505',
    surface: '#111111',
    surfaceLight: '#0A0A0A',
    border: 'rgba(34,197,94,0.25)',
    borderLight: 'rgba(34,197,94,0.35)',
    text: '#ffffff',
    textMuted: '#A1A1AA'
  },
  'wine-noir': {
    accent: '#7A1F3D',
    accentHover: '#9D294F',
    bg: '#050505',
    surface: '#111111',
    surfaceLight: '#1a1a1a',
    border: 'rgba(122,31,61,0.25)',
    borderLight: 'rgba(122,31,61,0.35)',
    text: '#ffffff',
    textMuted: '#A1A1AA'
  },
  'velvet-noir': {
    accent: '#4C1D95',
    accentHover: '#5B21B6',
    bg: '#050505',
    surface: '#111111',
    surfaceLight: '#0A0A0A',
    border: 'rgba(76,29,149,0.25)',
    borderLight: 'rgba(76,29,149,0.35)',
    text: '#ffffff',
    textMuted: '#A1A1AA'
  }
}

function App() {
  const audioRef = useRef(null)
  const [songsData, setSongsData] = useState(songs)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [view, setView] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [playlist, setPlaylist] = useState([])
  const [queue, setQueue] = useState([])
  const [recentlyPlayed, setRecentlyPlayed] = useState([])
  const [showFullscreenPlayer, setShowFullscreenPlayer] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [slideDirection, setSlideDirection] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [dominantColor, setDominantColor] = useState('#000000')
  
  // Swipe detection refs
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndX = useRef(0)
  const touchEndY = useRef(0)
  
  const tabOrder = ['home', 'search', 'library', 'favorites', 'settings']
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    // Migrate removed themes
    if (saved === 'violet-eclipse' || saved === 'sunset-gold') {
      localStorage.setItem('theme', 'midnight-black')
      return 'midnight-black'
    }
    return saved || 'midnight-black'
  })
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('appearance')
    return saved === 'light' || false
  })
  const [listeningStats, setListeningStats] = useState(() => {
    const saved = localStorage.getItem('listeningStats')
    return saved ? JSON.parse(saved) : {
      songsPlayed: 0,
      minutesListened: 0,
      artistPlays: {},
      albumPlays: {}
    }
  })
  const currentTheme = themes[theme]
  
  // Apply light/dark mode to theme
  const appliedTheme = isLightMode ? {
    ...currentTheme,
    bg: '#ffffff',
    surface: '#f5f5f7',
    surfaceLight: '#ffffff',
    border: '#e5e5e5',
    borderLight: '#d1d1d6',
    text: '#111111',
    textMuted: '#6e6e73'
  } : currentTheme

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const handleAppearanceChange = (appearance) => {
    const isLight = appearance === 'light'
    setIsLightMode(isLight)
    localStorage.setItem('appearance', appearance)
  }

  // Audio control
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentSong])

  const handleSeek = (e) => {
    if (audioRef.current) {
      const seekTime = (e.target.value / 100) * audioRef.current.duration
      audioRef.current.currentTime = seekTime
      setProgress(e.target.value)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progressPercent = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(progressPercent)
      setCurrentTime(audioRef.current.currentTime)
      setDuration(audioRef.current.duration)
    }
  }

  // Track listening time
  useEffect(() => {
    let interval
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setListeningStats(prev => {
          const updated = {
            ...prev,
            minutesListened: prev.minutesListened + (1/60) // Add 1 minute every 60 seconds
          }
          localStorage.setItem('listeningStats', JSON.stringify(updated))
          return updated
        })
      }, 1000) // Update every second
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentSong])

  // Fetch songs from Supabase on mount, fallback to songs.js
  const FORCE_LOCAL_MODE = false

  // Clear local cache on app load to ensure fresh data
  useEffect(() => {
    const SONG_CACHE_VERSION = 'v2'
    const cachedVersion = localStorage.getItem('songCacheVersion')
    
    if (cachedVersion !== SONG_CACHE_VERSION) {
      console.log('Song cache version mismatch, clearing cache')
      localStorage.removeItem('playbackSession')
      localStorage.removeItem('listeningStats')
      localStorage.removeItem('songCacheVersion')
      localStorage.setItem('songCacheVersion', SONG_CACHE_VERSION)
    } else {
      console.log('Song cache version matches:', SONG_CACHE_VERSION)
    }
  }, [])

  useEffect(() => {
    async function fetchSongs() {
      console.log('=== Supabase Fetch Started ===')
      console.log('ENV:', import.meta.env.MODE)
      console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET')
      console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
      console.log('FORCE_LOCAL_MODE:', FORCE_LOCAL_MODE)
      console.log('isSupabaseConfigured:', isSupabaseConfigured)
      console.log('supabase client:', supabase ? 'CREATED' : 'NULL')

      if (FORCE_LOCAL_MODE || !isSupabaseConfigured) {
        console.log('Using songs.js fallback (forced local mode for testing)')
        console.log('Fallback reason:', FORCE_LOCAL_MODE ? 'FORCE_LOCAL_MODE is true' : 'Supabase not configured')
        console.log('Song source used: songs.js (local fallback)')
        setSongsData(songs)
        console.log('Loaded songs count:', songs.length)
        console.log('First 5 songs:', songs.slice(0, 5))
        setLoading(false)
        return
      }

      try {
        console.log('Fetching from Supabase songs table...')
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .order('title', { ascending: true })

        if (error) {
          console.error('Supabase error:', error)
          console.log('Falling back to songs.js due to Supabase error')
          console.log('Song source used: songs.js (Supabase error fallback)')
          setError('Failed to fetch from Supabase, using fallback')
          setSongsData(songs)
          console.log('Loaded songs count:', songs.length)
          console.log('First 5 songs:', songs.slice(0, 5))
        } else if (data && data.length > 0) {
          console.log('Supabase fetch SUCCESS')
          console.log('Number of songs returned:', data.length)
          console.log('First song data:', data[0])
          
          // Map snake_case to camelCase and validate
          const mappedSongs = data
            .map(song => ({
              ...song,
              audioUrl: song.audio_url,
              // Add any other field mappings if needed
            }))
            .filter(song => {
              // Validate song has required fields
              const hasTitle = song.title && song.title.trim().length > 0
              const hasAudioUrl = song.audioUrl && song.audioUrl.trim().length > 0
              const isValid = hasTitle && hasAudioUrl
              
              if (!isValid) {
                console.warn('Filtered out invalid song:', song)
              }
              
              return isValid
            })
          
          console.log('Mapped song object:', mappedSongs[0])
          console.log('Valid songs count after filtering:', mappedSongs.length)
          setSongsData(mappedSongs)
          console.log(`Loaded ${mappedSongs.length} songs from Supabase`)
          console.log('Song source used: Supabase (production database)')
          console.log('First 5 songs:', mappedSongs.slice(0, 5))
          console.log('=== Using Supabase Data Source ===')
        } else {
          console.log('Supabase returned empty array')
          console.log('Falling back to songs.js')
          console.log('Song source used: songs.js (Supabase empty fallback)')
          setSongsData(songs)
          console.log('Loaded songs count:', songs.length)
          console.log('First 5 songs:', songs.slice(0, 5))
          console.log('=== Using songs.js Fallback ===')
        }
      } catch (err) {
        console.error('Error fetching songs:', err)
        console.log('Falling back to songs.js due to exception')
        console.log('Song source used: songs.js (exception fallback)')
        setError('Failed to fetch from Supabase, using fallback')
        setSongsData(songs)
        console.log('Loaded songs count:', songs.length)
        console.log('First 5 songs:', songs.slice(0, 5))
        console.log('=== Using songs.js Fallback ===')
      } finally {
        setLoading(false)
      }
    }

    fetchSongs()
  }, [])

  // Media Session API setup
  const updateMediaSession = (song) => {
    if ('mediaSession' in navigator) {
      const metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist || 'Unknown Artist',
        album: song.album || 'Unknown Album',
        artwork: [
          {
            src: song.cover,
            sizes: '512x512',
            type: 'image/jpeg'
          },
          {
            src: song.cover,
            sizes: '96x96',
            type: 'image/jpeg'
          }
        ]
      })
      
      navigator.mediaSession.metadata = metadata
      
      // Set up action handlers
      navigator.mediaSession.setActionHandler('play', () => {
        handlePlay(currentSong)
      })
      
      navigator.mediaSession.setActionHandler('pause', () => {
        handlePause()
      })
      
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleNext()
      })
      
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlePrevious()
      })
    }
  }

  const handlePlay = (song) => {
    setCurrentSong(song)
    setIsPlaying(true)
    setProgress(0)
    
    // Extract dominant color from album artwork
    if (song.cover) {
      extractDominantColor(song.cover).then(color => {
        setDominantColor(color)
      }).catch(err => {
        console.error('Failed to extract color:', err)
      })
    }
    
    // Update Media Session API
    updateMediaSession(song)
    
    // Update playback state
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing'
    }
    
    // Update listening stats
    setListeningStats(prev => {
      const updated = {
        ...prev,
        songsPlayed: prev.songsPlayed + 1,
        artistPlays: {
          ...prev.artistPlays,
          [song.artist]: (prev.artistPlays[song.artist] || 0) + 1
        },
        albumPlays: {
          ...prev.albumPlays,
          [song.album]: (prev.albumPlays[song.album] || 0) + 1
        }
      }
      localStorage.setItem('listeningStats', JSON.stringify(updated))
      return updated
    })
    
    // Add to recently played
    setRecentlyPlayed(prev => {
      // Remove if already exists (to move to top)
      const filtered = prev.filter(s => s.id !== song.id)
      // Add to beginning
      const updated = [song, ...filtered]
      // Limit to 10
      return updated.slice(0, 10)
    })
  }

  const handlePause = () => {
    setIsPlaying(false)
    
    // Update playback state
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused'
    }
  }

  const handleNext = () => {
    // Play from queue if not empty
    if (queue.length > 0) {
      const nextQueueSong = queue[0]
      playFromQueue(nextQueueSong)
      return
    }
    
    // Otherwise play next song from library
    const currentIndex = songsData.findIndex(s => s.id === currentSong?.id)
    const nextIndex = (currentIndex + 1) % songsData.length
    setCurrentSong(songsData[nextIndex])
    setProgress(0)
  }

  const handlePrevious = () => {
    const currentIndex = songsData.findIndex(s => s.id === currentSong?.id)
    const prevIndex = currentIndex === 0 ? songsData.length - 1 : currentIndex - 1
    setCurrentSong(songsData[prevIndex])
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

  const addToQueue = (song) => {
    if (!queue.find(s => s.id === song.id)) {
      setQueue([...queue, song])
    }
  }

  const removeFromQueue = (songId) => {
    setQueue(queue.filter(s => s.id !== songId))
  }

  const playFromQueue = (song) => {
    setCurrentSong(song)
    setQueue(queue.filter(s => s.id !== song.id))
    setIsPlaying(true)
    setProgress(0)
  }

  // Save playback session to localStorage
  const savePlaybackSession = useCallback(() => {
    if (currentSong) {
      const session = {
        songId: currentSong.id,
        currentTime: currentTime,
        duration: duration,
        isPlaying: isPlaying,
        queue: queue,
        timestamp: Date.now()
      }
      localStorage.setItem('playbackSession', JSON.stringify(session))
    }
  }, [currentSong, currentTime, duration, isPlaying, queue])

  // Save playback session regularly while playing
  useEffect(() => {
    let interval
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        savePlaybackSession()
      }, 3000) // Save every 3 seconds
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentSong, savePlaybackSession])

  // Save playback session on pause
  useEffect(() => {
    if (!isPlaying && currentSong) {
      savePlaybackSession()
    }
  }, [isPlaying, currentSong, savePlaybackSession])

  // Save playback session on song change
  useEffect(() => {
    if (currentSong) {
      savePlaybackSession()
    }
  }, [currentSong, savePlaybackSession])

  // Save playback session before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      savePlaybackSession()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [savePlaybackSession])

  // Restore playback session on app load
  useEffect(() => {
    if (songsData.length > 0) {
      const savedSession = localStorage.getItem('playbackSession')
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession)
          
          // Check if the saved song still exists
          const savedSong = songsData.find(s => s.id === session.songId)
          if (savedSong) {
            // Restore the song
            setCurrentSong(savedSong)
            
            // Restore the playback position
            setCurrentTime(session.currentTime)
            setDuration(session.duration)
            setProgress((session.currentTime / session.duration) * 100)
            
            // Restore queue
            if (session.queue && session.queue.length > 0) {
              const validQueue = session.queue.filter(q => songsData.find(s => s.id === q.id))
              setQueue(validQueue)
            }
            
            // Do NOT autoplay - just restore the state
            setIsPlaying(false)
            
            // If playback time is near the end (within 5 seconds), reset to 0
            if (session.duration - session.currentTime < 5) {
              setCurrentTime(0)
              setProgress(0)
            }
          } else {
            // Song no longer exists, clear the session
            localStorage.removeItem('playbackSession')
          }
        } catch (error) {
          console.error('Error restoring playback session:', error)
          localStorage.removeItem('playbackSession')
        }
      }
    }
  }, [songsData])

  // Calculate favorite artist and album
  const favoriteArtist = Object.entries(listeningStats.artistPlays).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const favoriteAlbum = Object.entries(listeningStats.albumPlays).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  // Swipe navigation handler
  const handleSwipe = useCallback((direction) => {
    if (isAnimating) return
    
    const currentIndex = tabOrder.indexOf(view)
    if (currentIndex === -1) return
    
    let newIndex = currentIndex
    if (direction === 'left' && currentIndex < tabOrder.length - 1) {
      newIndex = currentIndex + 1
    } else if (direction === 'right' && currentIndex > 0) {
      newIndex = currentIndex - 1
    }
    
    if (newIndex !== currentIndex) {
      setSlideDirection(direction === 'left' ? 'next' : 'prev')
      setIsAnimating(true)
      
      setTimeout(() => {
        setView(tabOrder[newIndex])
        setSlideDirection(null)
        setIsAnimating(false)
      }, 50)
    }
  }, [view, isAnimating, tabOrder])

  // Touch event handlers for swipe detection
  const handleTouchStart = useCallback((e) => {
    // Check if touch is on a slider or progress bar
    const target = e.target
    if (target.tagName === 'INPUT' && target.type === 'range') {
      return
    }
    
    // Check if touch is inside a horizontally scrollable element
    const scrollableParent = target.closest('[class*="overflow-x"]')
    if (scrollableParent) {
      return
    }
    
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback(() => {
    const deltaX = touchEndX.current - touchStartX.current
    const deltaY = touchEndY.current - touchStartY.current
    
    // Swipe threshold: 70px
    const swipeThreshold = 70
    
    // Only trigger if horizontal movement is greater than vertical movement
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        handleSwipe('right')
      } else {
        handleSwipe('left')
      }
    }
  }, [handleSwipe])

  // Add touch event listeners on mount (mobile only)
  // DISABLED: Swipe navigation conflicts with mini player, fullscreen player, buttons, and song cards
  // useEffect(() => {
  //   const isMobile = window.innerWidth < 768
    
  //   if (isMobile) {
  //     document.addEventListener('touchstart', handleTouchStart, { passive: true })
  //     document.addEventListener('touchmove', handleTouchMove, { passive: true })
  //     document.addEventListener('touchend', handleTouchEnd, { passive: true })
      
  //     return () => {
  //       document.removeEventListener('touchstart', handleTouchStart)
  //       document.removeEventListener('touchmove', handleTouchMove)
  //       document.removeEventListener('touchend', handleTouchEnd)
  //     }
  //   }
  // }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <>
      {/* Global body background based on theme */}
      <style>{`
        body {
          background-color: ${isLightMode ? '#ffffff' : '#000000'};
        }
      `}</style>
      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      
      <div className="flex h-screen relative overflow-hidden" style={{ backgroundColor: appliedTheme.bg }}>
      {/* Dynamic blurred background */}
      {currentSong && !isLightMode && (
        <div className="absolute inset-0 z-0">
          <img
            src={currentSong.cover}
            alt=""
            className="w-full h-full object-cover opacity-40 blur-3xl scale-110 transition-all duration-1000 ease-in-out"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 flex h-screen w-full">
        <Sidebar 
          view={view} 
          setView={setView}
          playlist={playlist}
          removeFromPlaylist={removeFromPlaylist}
          currentTheme={appliedTheme}
          isLightMode={isLightMode}
        />
        <MainContent 
          view={view}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onPlay={handlePlay}
          currentSong={currentSong}
          addToPlaylist={addToPlaylist}
          playlist={playlist}
          queue={queue}
          addToQueue={addToQueue}
          removeFromQueue={removeFromQueue}
          playFromQueue={playFromQueue}
          recentlyPlayed={recentlyPlayed}
          songs={songsData}
          loading={loading}
          error={error}
          onOpenFullscreen={() => {
            hapticLight()
            setShowFullscreenPlayer(true)
          }}
          listeningStats={listeningStats}
          favoriteArtist={favoriteArtist}
          favoriteAlbum={favoriteAlbum}
          theme={theme}
          currentTheme={appliedTheme}
          onThemeChange={handleThemeChange}
          themes={themes}
          slideDirection={slideDirection}
          isAnimating={isAnimating}
          isLightMode={isLightMode}
          onAppearanceChange={handleAppearanceChange}
        />
      </div>
      
      {/* Player - fixed at bottom with z-20 */}
      <audio
        ref={audioRef}
        src={currentSong?.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
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
        onOpenFullscreen={() => {
          hapticLight()
          setShowFullscreenPlayer(true)
        }}
        currentTheme={appliedTheme}
        audioRef={audioRef}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        onTimeUpdate={handleTimeUpdate}
        isLightMode={isLightMode}
        dominantColor={dominantColor}
      />
      
      {/* Fullscreen Player - z-50 for highest layer */}
      {showFullscreenPlayer && currentSong && (
        <FullscreenPlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          progress={progress}
          setProgress={setProgress}
          onPlay={handlePlay}
          onPause={handlePause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onClose={() => setShowFullscreenPlayer(false)}
          currentTheme={appliedTheme}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          isLightMode={isLightMode}
          dominantColor={dominantColor}
        />
      )}
    </div>
    </>
  )
}

export default App
