import { useState, useMemo, useEffect } from 'react'
import { Play, Plus, Clock, ListPlus, Heart } from 'lucide-react'
import { hapticLight, hapticMedium, hapticSuccess, hapticSelection } from '../lib/haptics'
import { getDailyPick, getDailyRecommendations } from '../lib/dailyPick'
import { getCoverForSong } from '../utils/covers'
import Skeleton from './ui/Skeleton'

function MainContent({ view, searchQuery, setSearchQuery, onPlay, currentSong, addToPlaylist, playlist, queue, addToQueue, removeFromQueue, playFromQueue, recentlyPlayed, songs, loading, error, onOpenFullscreen, listeningStats, favoriteArtist, favoriteAlbum, theme, currentTheme, onThemeChange, themes, slideDirection, isAnimating, isLightMode, onAppearanceChange, hapticFeedbackEnabled, setHapticFeedbackEnabled, favoriteSongs, toggleFavorite, sleepTimer, setSleepTimer, pauseFadeMode, setPauseFadeMode }) {
  const filteredSongs = useMemo(() => songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album.toLowerCase().includes(searchQuery.toLowerCase())
  ), [songs, searchQuery])

  const [imageErrors, setImageErrors] = useState({})
  const [featuredSong, setFeaturedSong] = useState(null)
  const [isFeaturedTransitioning, setIsFeaturedTransitioning] = useState(false)
  const [timePeriod, setTimePeriod] = useState('')
  const [discoverSongs, setDiscoverSongs] = useState([])
  const [isDiscoverTransitioning, setIsDiscoverTransitioning] = useState(false)
  const [recommendedSongs, setRecommendedSongs] = useState([])
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(false)
  const [crossfadeDuration, setCrossfadeDuration] = useState(4)
  const [autoplayEnabled, setAutoplayEnabled] = useState(false)
  const [rememberLastPlayed, setRememberLastPlayed] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // Page loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false)
    }, 450)
    return () => clearTimeout(timer)
  }, [])

  // Load playback settings from localStorage
  useEffect(() => {
    const savedCrossfadeEnabled = localStorage.getItem('crossfadeEnabled')
    const savedCrossfadeDuration = localStorage.getItem('crossfadeDuration')
    const savedAutoplayEnabled = localStorage.getItem('autoplayEnabled')
    const savedRememberLastPlayed = localStorage.getItem('rememberLastPlayed')

    if (savedCrossfadeEnabled !== null) setCrossfadeEnabled(savedCrossfadeEnabled === 'true')
    if (savedCrossfadeDuration !== null) setCrossfadeDuration(parseInt(savedCrossfadeDuration))
    if (savedAutoplayEnabled !== null) setAutoplayEnabled(savedAutoplayEnabled === 'true')
    if (savedRememberLastPlayed !== null) setRememberLastPlayed(savedRememberLastPlayed === 'true')
  }, [])

  // Determine time period (morning/evening)
  const getTimePeriod = () => {
    const hour = new Date().getHours()
    return hour >= 5 && hour < 18 ? 'morning' : 'evening'
  }

  // Use date-based random selection for featured song
  useEffect(() => {
    if (songs.length > 0) {
      const period = getTimePeriod()
      setTimePeriod(period)
      
      const dailyPick = getDailyPick(songs)
      
      if (dailyPick) {
        setIsFeaturedTransitioning(true)
        setFeaturedSong(dailyPick)
        setTimeout(() => setIsFeaturedTransitioning(false), 300)
      }
    }
  }, [songs])

  // Use date-based random selection for recommended songs
  useEffect(() => {
    if (songs.length > 0 && featuredSong) {
      const recommendations = getDailyRecommendations(songs, 6, featuredSong.id)
      setRecommendedSongs(recommendations)
    }
  }, [songs, featuredSong])

  // Randomly select discover songs for the day
  useEffect(() => {
    if (songs.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const storageKey = `discoverSongs_${today}`
      
      // Check if we already have discover songs for today
      const storedSongs = localStorage.getItem(storageKey)
      
      if (storedSongs) {
        // Use the stored songs
        const parsedSongs = JSON.parse(storedSongs)
        setIsDiscoverTransitioning(true)
        setTimeout(() => {
          setDiscoverSongs(parsedSongs)
          setTimeout(() => {
            setIsDiscoverTransitioning(false)
          }, 150)
        }, 150)
      } else {
        // Select new discover songs
        // Get songs with cover artwork first
        const songsWithCover = songs.filter(song => 
          song.cover && !song.cover.includes('unsplash')
        )
        
        // Use songs with cover if available, otherwise use all songs
        const availableSongs = songsWithCover.length > 0 ? songsWithCover : songs
        
        // Get featured song to avoid duplicates
        const period = getTimePeriod()
        const featuredStorageKey = `featuredSong_${today}_${period}`
        const featuredStoredSong = localStorage.getItem(featuredStorageKey)
        const featuredSongId = featuredStoredSong ? JSON.parse(featuredStoredSong).id : null
        
        // Filter out featured song if possible
        let candidateSongs = availableSongs
        if (featuredSongId && availableSongs.length > 1) {
          candidateSongs = availableSongs.filter(song => song.id !== featuredSongId)
        }
        
        // Shuffle the candidate songs
        const shuffled = [...candidateSongs].sort(() => Math.random() - 0.5)
        
        // Select up to 6 songs for discover section
        const selectedSongs = shuffled.slice(0, Math.min(6, shuffled.length))
        
        // Store the selected songs in localStorage
        localStorage.setItem(storageKey, JSON.stringify(selectedSongs))
        
        // Set discover songs with fade transition
        setIsDiscoverTransitioning(true)
        setTimeout(() => {
          setDiscoverSongs(selectedSongs)
          setTimeout(() => {
            setIsDiscoverTransitioning(false)
          }, 150)
        }, 150)
      }
    }
  }, [songs])

  const handleImageError = (songId) => {
    setImageErrors(prev => ({ ...prev, [songId]: true }))
  }

  const handleAlbumClick = (song) => {
    // Play the song immediately
    onPlay(song)
    hapticLight()
  }

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getGreetingEmoji = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '🌅'
    if (hour < 18) return '☀️'
    return '🌙'
  }

  // Calculate collection statistics
  const getCollectionStats = () => {
    try {
      const validSongs = songs.filter(s => s)
      const totalSongs = validSongs.length
      
      const uniqueArtists = new Set(
        validSongs
          .map(s => s.artist)
          .filter(a => a && a !== 'Unknown Artist')
      )
      const totalArtists = uniqueArtists.size
      
      const uniqueAlbums = new Set(
        validSongs
          .map(s => s.album)
          .filter(a => a && a !== 'Unknown Album')
      )
      const totalAlbums = uniqueAlbums.size
      
      // Calculate total duration
      let totalSeconds = 0
      validSongs.forEach(song => {
        if (song.duration) {
          const parts = song.duration.split(':')
          if (parts.length === 2) {
            const mins = parseInt(parts[0]) || 0
            const secs = parseInt(parts[1]) || 0
            totalSeconds += (mins * 60) + secs
          }
        }
      })
      
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      let durationStr = ''
      if (hours > 0) {
        durationStr = `${hours}h`
      } else if (minutes > 0) {
        durationStr = `${minutes}m`
      } else {
        durationStr = '0m'
      }
      
      return {
        totalSongs,
        totalArtists,
        totalAlbums,
        duration: durationStr
      }
    } catch (error) {
      console.error('Error calculating collection stats:', error)
      return null
    }
  }

  const collectionStats = getCollectionStats()
  const showInitialSkeleton = loading || isPageLoading
  const dailyMixOffset = useMemo(() => {
    const featuredCover = featuredSong ? getCoverForSong(featuredSong) : null

    if (!featuredCover || recommendedSongs.length === 0) {
      return 0
    }

    const firstDailyMixCover = getCoverForSong(recommendedSongs[0])
    return firstDailyMixCover === featuredCover ? 1 : 0
  }, [featuredSong, recommendedSongs])

  const renderFeaturedAlbumSkeleton = () => (
    <div className="mb-8">
      <div
        style={{
          background: isLightMode
            ? 'rgba(245, 245, 247, 0.75)'
            : 'linear-gradient(135deg, #1B1B2F 0%, #252545 45%, #141421 100%)',
          borderColor: isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
          boxShadow: isLightMode ? '0 18px 45px rgba(0, 0, 0, 0.06)' : '0 20px 50px rgba(0, 0, 0, 0.35)'
        }}
        className="relative backdrop-blur-xl mobile-lite-blur rounded-3xl overflow-hidden border"
      >
        <div className="md:hidden flex flex-col p-5">
          <Skeleton className="w-28 h-3 mb-3 rounded-full" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-28 h-28 flex-shrink-0 rounded-2xl" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-6 w-4/5 mb-2 rounded-full" />
              <Skeleton className="h-4 w-2/3 mb-4 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 p-6">
          <Skeleton className="w-32 h-32 flex-shrink-0 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-3 w-28 mb-3 rounded-full" />
            <Skeleton className="h-7 w-2/5 mb-3 rounded-full" />
            <Skeleton className="h-5 w-1/4 mb-3 rounded-full" />
            <Skeleton className="h-4 w-1/3 rounded-full" />
          </div>
          <Skeleton className="w-14 h-14 flex-shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  )

  const renderHorizontalCardSkeletons = (count) => (
    <div className="flex gap-4 overflow-x-auto mobile-scroll pb-2 scrollbar-hide -mx-4 px-4 pr-4 md:mx-0 md:px-0 md:pr-0">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex-shrink-0 w-36 md:w-40">
          <Skeleton className="w-full aspect-square rounded-2xl mb-3" />
          <Skeleton className="h-4 w-4/5 mb-2 rounded-full" />
          <Skeleton className="h-3 w-3/5 rounded-full" />
        </div>
      ))}
    </div>
  )

  const renderSongRowSkeletons = (count) => (
    <div className="backdrop-blur-xl mobile-lite-blur rounded-xl overflow-hidden border w-full" style={{ backgroundColor: `${currentTheme.surfaceLight}99`, borderColor: currentTheme.border }}>
      <div className="md:hidden">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-3 border-b last:border-b-0" style={{ borderColor: currentTheme.border }}>
            <Skeleton className="w-12 h-12 flex-shrink-0 rounded" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-3/4 mb-2 rounded-full" />
              <Skeleton className="h-3 w-1/2 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <table className="hidden md:table w-full">
        <thead>
          <tr className="text-left text-xs uppercase font-semibold tracking-wider" style={{ color: currentTheme.textMuted, borderColor: currentTheme.border }}>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2 hidden lg:table-cell">Time</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: count }).map((_, index) => (
            <tr key={index}>
              <td className="px-3 py-2">
                <Skeleton className="w-3 h-3 rounded-full" />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 flex-shrink-0 rounded" />
                  <div className="min-w-0 w-full">
                    <Skeleton className="h-4 w-1/3 mb-2 rounded-full" />
                    <Skeleton className="h-3 w-1/5 rounded-full" />
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 hidden lg:table-cell">
                <Skeleton className="h-3 w-10 rounded-full" />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1 justify-end">
                  <Skeleton className="w-6 h-6 rounded" />
                  <Skeleton className="w-6 h-6 rounded" />
                  <Skeleton className="w-6 h-6 rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderHomeSkeleton = () => (
    <div className="w-full md:px-0 px-4" style={{ backgroundColor: isLightMode ? '#FFFFFF' : 'transparent', minHeight: '100vh', paddingBottom: '180px' }}>
      <div className="md:hidden mb-6 pt-4">
        <h1 className="text-2xl font-bold mb-1" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>
          {getGreeting()}
        </h1>
        <p className="text-sm font-medium" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Welcome back, Anekh</p>
      </div>

      <div className="hidden md:block mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: currentTheme.text }}>
          {getGreeting()}
        </h1>
        <p style={{ color: currentTheme.textMuted }} className="mb-6 text-sm">Listen to your music</p>
      </div>

      {renderFeaturedAlbumSkeleton()}

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Daily Mix</h2>
        {renderHorizontalCardSkeletons(3)}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Recently Added</h2>
        {renderHorizontalCardSkeletons(5)}
      </div>
    </div>
  )

  const renderContent = () => {
    // Show error state (but still allow using fallback data)
    if (error && !loading) {
      return (
        <div className="rounded-lg p-4 w-full mb-6" style={{ backgroundColor: currentTheme.surfaceLight }}>
          <p className="text-sm mb-2" style={{ color: '#f59e0b' }}>{error}</p>
          <p className="text-xs" style={{ color: currentTheme.textMuted }}>Using fallback data from songs.js</p>
        </div>
      )
    }

    switch (view) {
      case 'home':
        if (showInitialSkeleton) {
          return renderHomeSkeleton()
        }

        return (
          <div className="w-full md:px-0 px-4" style={{ backgroundColor: isLightMode ? '#FFFFFF' : 'transparent', minHeight: '100vh', paddingBottom: '180px' }}>
            {/* Mobile Header */}
            <div className="md:hidden mb-6 pt-4">
              <h1 className="text-2xl font-bold mb-1" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>
                {getGreeting()}
              </h1>
              <p className="text-sm font-medium" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Welcome back, Anekh</p>
            </div>

            {/* Desktop Greeting */}
            <div className="hidden md:block mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: currentTheme.text }}>
                {getGreeting()}
              </h1>
              <p style={{ color: currentTheme.textMuted }} className="mb-6 text-sm">Listen to your music</p>
            </div>

            {/* Hero Section - Featured Song */}
            {featuredSong && (
              <div className="mb-8">
                <div
                  onClick={() => handleAlbumClick(featuredSong)}
                  style={{
                    background: isLightMode 
                      ? 'rgba(245, 245, 247, 0.75)'
                      : 'linear-gradient(135deg, #1B1B2F 0%, #252545 45%, #141421 100%)',
                    borderColor: isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: isLightMode ? '0 18px 45px rgba(0, 0, 0, 0.06)' : '0 20px 50px rgba(0, 0, 0, 0.35)'
                  }}
                  className={`relative backdrop-blur-xl mobile-lite-blur rounded-3xl overflow-hidden cursor-pointer group hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200 border ${isFeaturedTransitioning ? 'opacity-0' : 'opacity-100'}`}
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden flex flex-col p-5">
                    {/* Label */}
                    <p className="text-xs font-semibold mb-3 tracking-wider" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>FEATURED ALBUM</p>
                    
                    <div className="flex items-center gap-4">
                      {/* Cover */}
                      <div className="w-28 h-28 flex-shrink-0 relative">
                        {imageErrors[featuredSong.id] ? (
                          <div style={{ backgroundColor: isLightMode ? '#E5E7EB' : '#121212' }} className="w-full h-full rounded-2xl flex items-center justify-center shadow-xl">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ color: isLightMode ? '#6E6E73' : '#71717A' }}>
                              <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        ) : (
                          <img
                            src={getCoverForSong(featuredSong)}
                            alt={featuredSong.title}
                            decoding="async"
                            className="w-full h-full rounded-2xl object-cover song-cover shadow-xl transition-all duration-300 group-hover:scale-105 mobile-soft-shadow"
                            onError={() => handleImageError(featuredSong.id)}
                          />
                        )}
                      </div>
                      
                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold mb-1 truncate" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>{featuredSong.title}</h2>
                        {featuredSong.artist && featuredSong.artist !== 'Unknown Artist' && (
                          <p className="text-sm mb-3 truncate" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>{featuredSong.artist}</p>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAlbumClick(featuredSong)
                          }}
                          className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: isLightMode ? '#FFFFFF' : '#FFFFFF',
                            color: '#000000',
                            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          Play Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center gap-6 p-6">
                    {imageErrors[featuredSong.id] ? (
                      <div style={{ backgroundColor: isLightMode ? '#E5E7EB' : '#121212' }} className="w-32 h-32 rounded-xl flex items-center justify-center shadow-2xl">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: isLightMode ? '#6E6E73' : '#71717A' }}>
                          <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    ) : (
                      <img
                        src={getCoverForSong(featuredSong)}
                        alt={featuredSong.title}
                        decoding="async"
                        className="w-32 h-32 rounded-xl object-cover song-cover shadow-2xl transition-all duration-300 group-hover:scale-105"
                        onError={() => handleImageError(featuredSong.id)}
                      />
                    )}
                    <div className="flex-1">
                      <p style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }} className="text-xs uppercase tracking-wider mb-2">{timePeriod === 'morning' ? 'Morning Pick' : 'Evening Pick'}</p>
                      <h2 style={{ color: isLightMode ? '#111111' : '#FFFFFF' }} className="text-2xl font-bold mb-1 transition-colors">{featuredSong.title}</h2>
                      {featuredSong.artist && featuredSong.artist !== 'Unknown Artist' && (
                        <p style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }} className="text-lg mb-2">{featuredSong.artist}</p>
                      )}
                      {featuredSong.album && featuredSong.album !== 'Unknown Album' && (
                        <p style={{ color: isLightMode ? '#6E6E73' : '#71717A' }} className="text-sm">{featuredSong.album}</p>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAlbumClick(featuredSong)
                      }}
                      style={{ backgroundColor: isLightMode ? '#FFFFFF' : '#FFFFFF', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }} 
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-200"
                    >
                      <Play size={24} fill="black" className="text-black ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Mix Section */}
            {recommendedSongs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Daily Mix</h2>
                <div className="flex gap-4 overflow-x-auto mobile-scroll pb-2 scrollbar-hide -mx-4 px-4 pr-4 md:mx-0 md:px-0 md:pr-0">
                  {recommendedSongs.map((song, index) => (
                      <div
                        key={song.id}
                        onClick={() => handleAlbumClick(song)}
                        className="flex-shrink-0 w-36 md:w-40 group cursor-pointer song-card"
                      >
                        <div className="relative mb-3">
                          {imageErrors[song.id] ? (
                            <div className="w-full aspect-square rounded-2xl flex items-center justify-center" style={{ backgroundColor: isLightMode ? '#E5E7EB' : '#121212' }}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: isLightMode ? '#6E6E73' : '#71717A' }}>
                                <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          ) : (
                            <img
                              src={getCoverForSong(song, dailyMixOffset)}
                              alt={song.title}
                              loading="lazy"
                              decoding="async"
                              className="w-full aspect-square object-cover song-cover rounded-2xl group-hover:scale-105 transition-transform duration-200"
                              onError={() => handleImageError(song.id)}
                            />
                          )}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center backdrop-blur-sm mobile-lite-blur" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md mobile-lite-blur transition-all duration-200 group-hover:bg-opacity-22" style={{ backgroundColor: 'rgba(255, 255, 255, 0.14)', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
                            <Play size={20} fill="white" className="text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-medium truncate" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>{song.title}</p>
                      {song.artist && song.artist !== 'Unknown Artist' && (
                        <p className="text-xs truncate" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>{song.artist}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Continue Listening Section */}
            {recentlyPlayed && recentlyPlayed.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Recently Played</h2>
                <div className="flex gap-3 overflow-x-auto mobile-scroll pb-2 scrollbar-hide -mx-4 px-4 pr-4 md:mx-0 md:px-0 md:pr-0">
                  {recentlyPlayed.map((song, index) => (
                    <div
                      key={song.id}
                      onClick={() => handleAlbumClick(song)}
                      className="flex-shrink-0 w-36 md:w-40 group cursor-pointer song-card"
                    >
                      <div className="relative mb-3">
                        {imageErrors[song.id] ? (
                          <div className="w-full aspect-square rounded-2xl flex items-center justify-center" style={{ backgroundColor: isLightMode ? '#E5E7EB' : '#121212' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: isLightMode ? '#6E6E73' : '#71717A' }}>
                              <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        ) : (
                          <img
                            src={getCoverForSong(song)}
                            alt={song.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full aspect-square object-cover song-cover rounded-2xl group-hover:scale-105 transition-transform duration-200"
                            onError={() => handleImageError(song.id)}
                          />
                        )}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center backdrop-blur-sm mobile-lite-blur" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md mobile-lite-blur transition-all duration-200 group-hover:bg-opacity-22" style={{ backgroundColor: 'rgba(255, 255, 255, 0.14)', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
                            <Play size={20} fill="white" className="text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-medium truncate" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>{song.title}</p>
                      {song.artist && song.artist !== 'Unknown Artist' && (
                        <p className="text-xs truncate" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>{song.artist}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Added Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Recently Added</h2>
              <div className="flex gap-3 overflow-x-auto mobile-scroll pb-2 scrollbar-hide -mx-4 px-4 pr-4 md:mx-0 md:px-0 md:pr-0">
                {songs.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => handleAlbumClick(song)}
                    className="flex-shrink-0 w-36 md:w-40 group cursor-pointer song-card"
                  >
                    <div className="relative mb-3">
                      {imageErrors[song.id] ? (
                        <div className="w-full aspect-square rounded-2xl flex items-center justify-center" style={{ backgroundColor: isLightMode ? '#E5E7EB' : '#121212' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: isLightMode ? '#6E6E73' : '#71717A' }}>
                            <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={getCoverForSong(song)}
                          alt={song.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full aspect-square object-cover song-cover rounded-2xl group-hover:scale-105 transition-transform duration-200"
                          onError={() => handleImageError(song.id)}
                        />
                      )}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center backdrop-blur-sm mobile-lite-blur" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md mobile-lite-blur transition-all duration-200 group-hover:bg-opacity-22" style={{ backgroundColor: 'rgba(255, 255, 255, 0.14)', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
                          <Play size={20} fill="white" className="text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>{song.title}</p>
                    {song.artist && song.artist !== 'Unknown Artist' && (
                      <p className="text-xs truncate" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>{song.artist}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )
      case 'search':
        return (
          <div className="w-full" style={{ paddingTop: isLightMode ? '20px' : '0' }}>
            <h2 className="font-semibold mb-2" style={{ 
              color: isLightMode ? '#1F1F1F' : currentTheme.text,
              fontSize: isLightMode ? '26px' : '24px',
              fontWeight: isLightMode ? '600' : '600',
              lineHeight: '1.2'
            }}>Search</h2>
            <p className="mb-6" style={{ 
              color: isLightMode ? '#6E6E73' : currentTheme.textMuted,
              fontSize: isLightMode ? '15px' : '14px',
              fontWeight: isLightMode ? '400' : '400',
              marginTop: isLightMode ? '8px' : '0',
              marginBottom: isLightMode ? '24px' : '24px'
            }}>Find your favorite music</p>
            <input
              type="text"
              placeholder="Search songs, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors text-sm"
              style={{ 
                backgroundColor: currentTheme.surfaceLight,
                borderColor: currentTheme.border,
                color: currentTheme.text,
                placeholderColor: isLightMode ? '#8E8E93' : currentTheme.textMuted
              }}
            />
            {searchQuery ? (
              <div className="mt-6">
                {showInitialSkeleton ? (
                  renderSongRowSkeletons(8)
                ) : (
                  <SongList songs={filteredSongs} onPlay={onPlay} currentSong={currentSong} addToPlaylist={addToPlaylist} playlist={playlist} addToQueue={addToQueue} queue={queue} imageErrors={imageErrors} handleImageError={handleImageError} currentTheme={currentTheme} isLightMode={isLightMode} favoriteSongs={favoriteSongs} toggleFavorite={toggleFavorite} />
                )}
              </div>
            ) : (
              <div className="text-center py-20" style={{ color: currentTheme.textMuted }}>
                <p className="text-sm">Search for music</p>
              </div>
            )}
          </div>
        )
      case 'library':
        return (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: currentTheme.text }}>Your Library</h2>
            <p className="mb-6 text-sm" style={{ color: currentTheme.textMuted }}>Your personal music collection</p>
            {showInitialSkeleton ? (
              renderSongRowSkeletons(8)
            ) : (
              <SongList songs={songs} onPlay={onPlay} currentSong={currentSong} addToPlaylist={addToPlaylist} playlist={playlist} addToQueue={addToQueue} queue={queue} imageErrors={imageErrors} handleImageError={handleImageError} currentTheme={currentTheme} isLightMode={isLightMode} favoriteSongs={favoriteSongs} toggleFavorite={toggleFavorite} />
            )}
          </div>
        )
      case 'queue':
        return (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: currentTheme.text }}>Queue</h2>
            <p className="mb-6 text-sm" style={{ color: currentTheme.textMuted }}>Up next in your queue</p>
            {queue.length > 0 ? (
              <QueueList songs={queue} onPlay={playFromQueue} removeFromQueue={removeFromQueue} imageErrors={imageErrors} handleImageError={handleImageError} currentTheme={currentTheme} isLightMode={isLightMode} />
            ) : (
              <div className="text-center py-20" style={{ color: currentTheme.textMuted }}>
                <p className="text-sm">Your queue is empty</p>
              </div>
            )}
          </div>
        )
      case 'favorites':
        const favoriteSongsList = songs.filter(song => favoriteSongs.includes(song.id || song.title))
        return (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: currentTheme.text }}>Favorites</h2>
            <p className="mb-6 text-sm" style={{ color: currentTheme.textMuted }}>Your favorite tracks</p>
            {showInitialSkeleton ? (
              renderSongRowSkeletons(8)
            ) : favoriteSongsList.length > 0 ? (
              <SongList songs={favoriteSongsList} onPlay={onPlay} currentSong={currentSong} addToPlaylist={addToPlaylist} playlist={playlist} addToQueue={addToQueue} queue={queue} imageErrors={imageErrors} handleImageError={handleImageError} currentTheme={currentTheme} isLightMode={isLightMode} favoriteSongs={favoriteSongs} toggleFavorite={toggleFavorite} />
            ) : (
              <div className="text-center py-20" style={{ color: currentTheme.textMuted }}>
                <p className="text-sm mb-2">No favorites yet</p>
                <p className="text-xs">Tap the heart on songs you love.</p>
              </div>
            )}
          </div>
        )
      case 'settings':
        return (
          <div className="w-full max-w-none">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: currentTheme.text }}>Settings</h2>
            <p className="mb-6 text-sm" style={{ color: currentTheme.textMuted }}>Customize your experience</p>
            
            {/* Profile Section */}
            <div className="backdrop-blur-xl rounded-2xl p-5 mb-5 border w-full" style={{ backgroundColor: isLightMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)', borderColor: isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)' }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: isLightMode ? '#E5E7EB' : '#1F1F1F' }}>
                  <span className="text-xl font-bold" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>A</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-0.5" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Anekh</h3>
                  <p className="text-sm" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Music listener</p>
                </div>
              </div>
            </div>

            {/* Appearance Selector */}
            <div className="backdrop-blur-xl rounded-2xl p-[18px] mb-5 border w-full" style={{ backgroundColor: isLightMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)', borderColor: isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: isLightMode ? '#111111' : '#FFFFFF', fontSize: '17px' }}>Appearance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => {
                    onAppearanceChange('dark')
                    hapticSelection()
                  }}
                  className="flex items-center gap-3 px-4 py-[14px] rounded-2xl border transition-all"
                  style={!isLightMode ? {
                    borderColor: 'rgba(255, 255, 255, 0.18)',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)'
                  } : {
                    borderColor: 'rgba(0, 0, 0, 0.06)',
                    backgroundColor: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => {
                    if (isLightMode) {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <div
                    className="w-[42px] h-[42px] rounded-full bg-black border border-gray-600 flex-shrink-0"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: isLightMode ? '#111111' : '#F5F5F7', fontSize: '17px' }}>
                      Dark Mode
                    </p>
                    <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA', fontSize: '13px' }}>
                      {!isLightMode ? 'Active' : 'Click to apply'}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onAppearanceChange('light')
                    hapticSelection()
                  }}
                  className="flex items-center gap-3 px-4 py-[14px] rounded-2xl border transition-all"
                  style={isLightMode ? {
                    borderColor: 'rgba(0, 0, 0, 0.18)',
                    backgroundColor: '#FFFFFF'
                  } : {
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                    backgroundColor: 'rgba(255, 255, 255, 0.035)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLightMode) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLightMode) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
                    }
                  }}
                >
                  <div
                    className="w-[42px] h-[42px] rounded-full bg-white border border-gray-300 flex-shrink-0"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: isLightMode ? '#111111' : '#FFFFFF', fontSize: '17px' }}>
                      Light Mode
                    </p>
                    <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA', fontSize: '13px' }}>
                      {isLightMode ? 'Active' : 'Click to apply'}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Color Style Selector (Accent Color) */}
            <div className="backdrop-blur-xl rounded-2xl p-[18px] mb-5 border w-full" style={{ backgroundColor: isLightMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)', borderColor: isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: isLightMode ? '#111111' : '#FFFFFF', fontSize: '17px' }}>Accent Color</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 w-full">
                {Object.entries(themes).map(([themeKey, themeColors]) => (
                  <button
                    key={themeKey}
                    onClick={() => {
                      onThemeChange(themeKey)
                      hapticSelection()
                    }}
                    className="p-4 rounded-2xl border transition-all"
                    style={theme === themeKey ? {
                      borderColor: isLightMode ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.18)',
                      backgroundColor: isLightMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)'
                    } : {
                      borderColor: isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                      backgroundColor: isLightMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLightMode && theme !== themeKey) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLightMode && theme !== themeKey) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-[42px] h-[42px] rounded-full flex-shrink-0"
                        style={{ backgroundColor: themeColors.accent }}
                      />
                      <div className="text-left">
                        <p className="text-sm font-medium capitalize" style={{ color: theme === themeKey ? (isLightMode ? '#111111' : '#F5F5F7') : (isLightMode ? '#111111' : '#FFFFFF'), fontSize: '17px' }}>
                          {themeKey.replace('-', ' ')}
                        </p>
                        <p className="text-xs" style={{ color: theme === themeKey ? (isLightMode ? '#6E6E73' : '#A1A1AA') : (isLightMode ? '#6E6E73' : '#A1A1AA'), fontSize: '13px' }}>
                          {theme === themeKey ? 'Active' : 'Click to apply'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Playback Section */}
            <div className="backdrop-blur-xl rounded-2xl p-[18px] mb-5 border w-full" style={{ backgroundColor: isLightMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)', borderColor: isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: isLightMode ? '#111111' : '#FFFFFF', fontSize: '17px' }}>Playback</h3>

              {/* Pause Fade Selector */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3 gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Pause Fade</p>
                    <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Smoothly lowers volume before pausing.</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    ['off', 'Off'],
                    ['short', 'Short'],
                    ['medium', 'Medium'],
                    ['long', 'Long']
                  ].map(([mode, label]) => {
                    const isSelected = pauseFadeMode === mode

                    return (
                      <button
                        key={mode}
                        onClick={() => {
                          setPauseFadeMode(mode)
                          localStorage.setItem('aura_pause_fade_duration', mode)
                          hapticSelection()
                        }}
                        className="px-3 py-2 rounded-lg border transition-all text-sm"
                        style={{
                          borderColor: isSelected
                            ? (isLightMode ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.18)')
                            : (isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)'),
                          backgroundColor: isSelected
                            ? (isLightMode ? '#F5F5F7' : 'rgba(255, 255, 255, 0.08)')
                            : (isLightMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)'),
                          color: isSelected
                            ? (isLightMode ? '#111111' : '#FFFFFF')
                            : (isLightMode ? '#6E6E73' : '#A1A1AA')
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* Autoplay Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Autoplay next song</p>
                  <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Automatically play the next song</p>
                </div>
                <button
                  onClick={() => {
                    setAutoplayEnabled(!autoplayEnabled)
                    localStorage.setItem('autoplayEnabled', (!autoplayEnabled).toString())
                    hapticSelection()
                  }}
                  className="w-12 h-7 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: autoplayEnabled ? currentTheme.accent : (isLightMode ? '#E5E7EB' : '#3A3A3C')
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: '#FFFFFF',
                      transform: autoplayEnabled ? 'translateX(20px)' : 'translateX(2px)'
                    }}
                  />
                </button>
              </div>

              {/* Crossfade Toggle */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Crossfade</p>
                    <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Smooth transition between songs</p>
                  </div>
                  <button
                    onClick={() => {
                      setCrossfadeEnabled(!crossfadeEnabled)
                      localStorage.setItem('crossfadeEnabled', (!crossfadeEnabled).toString())
                      hapticSelection()
                    }}
                    className="w-12 h-7 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: crossfadeEnabled ? currentTheme.accent : (isLightMode ? '#E5E7EB' : '#3A3A3C')
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: '#FFFFFF',
                        transform: crossfadeEnabled ? 'translateX(20px)' : 'translateX(2px)'
                      }}
                    />
                  </button>
                </div>
                
                {/* Crossfade Slider */}
                {crossfadeEnabled && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Duration</span>
                      <span className="text-xs font-medium" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>{crossfadeDuration}s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      value={crossfadeDuration}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        setCrossfadeDuration(value)
                        localStorage.setItem('crossfadeDuration', value.toString())
                      }}
                      className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: isLightMode ? '#E5E7EB' : '#3A3A3C'
                      }}
                    />
                    {/* TODO: connect crossfade setting to audio playback engine */}
                  </div>
                )}
              </div>

              {/* Remember Last Played Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Remember last played song</p>
                  <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Resume from where you left off</p>
                </div>
                <button
                  onClick={() => {
                    setRememberLastPlayed(!rememberLastPlayed)
                    localStorage.setItem('rememberLastPlayed', (!rememberLastPlayed).toString())
                    hapticSelection()
                  }}
                  className="w-12 h-7 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: rememberLastPlayed ? currentTheme.accent : (isLightMode ? '#E5E7EB' : '#3A3A3C')
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: '#FFFFFF',
                      transform: rememberLastPlayed ? 'translateX(20px)' : 'translateX(2px)'
                    }}
                  />
                </button>
              </div>

              {/* Sleep Timer */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Sleep Timer</p>
                    <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>
                      {sleepTimer === 'off' ? 'Pause playback after set time' : `Sleep timer: ${sleepTimer === '15min' ? '15 min' : sleepTimer === '30min' ? '30 min' : sleepTimer === '45min' ? '45 min' : sleepTimer === '1hour' ? '1 hour' : 'End of song'}`}
                    </p>
                  </div>
                </div>
                <select
                  value={sleepTimer}
                  onChange={(e) => {
                    setSleepTimer(e.target.value)
                    hapticSelection()
                  }}
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none transition-colors text-sm"
                  style={{
                    backgroundColor: currentTheme.surfaceLight,
                    borderColor: currentTheme.border,
                    color: currentTheme.text
                  }}
                >
                  <option value="off">Off</option>
                  <option value="15min">15 minutes</option>
                  <option value="30min">30 minutes</option>
                  <option value="45min">45 minutes</option>
                  <option value="1hour">1 hour</option>
                  <option value="end-of-song">End of current song</option>
                </select>
              </div>

              {/* Haptic Feedback Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Haptic Feedback</p>
                  <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Vibration on supported devices</p>
                </div>
                <button
                  onClick={() => {
                    setHapticFeedbackEnabled(!hapticFeedbackEnabled)
                    localStorage.setItem('hapticFeedbackEnabled', (!hapticFeedbackEnabled).toString())
                    hapticSelection()
                  }}
                  className="w-12 h-7 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: hapticFeedbackEnabled ? currentTheme.accent : (isLightMode ? '#E5E7EB' : '#3A3A3C')
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: '#FFFFFF',
                      transform: hapticFeedbackEnabled ? 'translateX(20px)' : 'translateX(2px)'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Compact Collection Overview */}
            {collectionStats && (
              <div className="backdrop-blur-xl rounded-2xl p-[18px] border w-full" style={{ backgroundColor: isLightMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)', borderColor: isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)' }}>
                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Your Collection</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px]">
                  <div className="text-center p-[14px] rounded-2xl" style={{ backgroundColor: isLightMode ? '#F5F5F7' : 'rgba(255, 255, 255, 0.04)' }}>
                    <p className="text-2xl font-bold mb-1" style={{ color: isLightMode ? '#111111' : '#FFFFFF', fontSize: '28px', fontWeight: 700 }}>{collectionStats.totalSongs}</p>
                    <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA', fontSize: '13px' }}>Songs</p>
                  </div>
                  <div className="text-center p-[14px] rounded-2xl" style={{ backgroundColor: isLightMode ? '#F5F5F7' : 'rgba(255, 255, 255, 0.04)' }}>
                    <p className="text-2xl font-bold mb-1" style={{ color: isLightMode ? '#111111' : '#FFFFFF', fontSize: '28px', fontWeight: 700 }}>{collectionStats.totalArtists}</p>
                    <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA', fontSize: '13px' }}>Artists</p>
                  </div>
                  <div className="text-center p-[14px] rounded-2xl" style={{ backgroundColor: isLightMode ? '#F5F5F7' : 'rgba(255, 255, 255, 0.04)' }}>
                    <p className="text-2xl font-bold mb-1" style={{ color: isLightMode ? '#111111' : '#FFFFFF', fontSize: '28px', fontWeight: 700 }}>{collectionStats.totalAlbums}</p>
                    <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA', fontSize: '13px' }}>Albums</p>
                  </div>
                  <div className="text-center p-[14px] rounded-2xl" style={{ backgroundColor: isLightMode ? '#F5F5F7' : 'rgba(255, 255, 255, 0.04)' }}>
                    <p className="text-2xl font-bold mb-1" style={{ color: isLightMode ? '#111111' : '#FFFFFF', fontSize: '28px', fontWeight: 700 }}>{collectionStats.duration}</p>
                    <p className="text-xs" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA', fontSize: '13px' }}>Duration</p>
                  </div>
                </div>
              </div>
            )}

            {/* About Section */}
            <div className="backdrop-blur-xl rounded-2xl p-[18px] border w-full" style={{ backgroundColor: isLightMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)', borderColor: isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: isLightMode ? '#111111' : '#FFFFFF', fontSize: '17px' }}>About</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>App name</p>
                  <p className="text-sm font-medium" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Vocale</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Version</p>
                  <p className="text-sm font-medium" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>1.0</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: isLightMode ? '#6E6E73' : '#A1A1AA' }}>Made by</p>
                  <p className="text-sm font-medium" style={{ color: isLightMode ? '#111111' : '#FFFFFF' }}>Anekh</p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <main 
      className={`flex-1 w-full min-w-0 overflow-y-auto p-6 pb-28 md:pb-28 ${isLightMode ? '' : 'dark'}`}
      style={{ 
        backgroundColor: currentTheme.bg,
        paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))',
        animation: slideDirection && isAnimating ? `slide${slideDirection === 'next' ? 'Left' : 'Right'} 0.3s ease-out` : 'none',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          main::-webkit-scrollbar {
            display: none;
            -webkit-appearance: none;
            width: 0;
            height: 0;
          }
        }

        @media (min-width: 768px) {
          .desktop-page-transition {
            animation: desktopPageEnter 180ms ease-out;
          }
        }

        @keyframes desktopPageEnter {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div key={view} className="desktop-page-transition">
        {renderContent()}
      </div>
    </main>
  )
}

function SongList({ songs, onPlay, currentSong, addToPlaylist, playlist, addToQueue, queue, imageErrors, handleImageError, currentTheme, isLightMode, favoriteSongs, toggleFavorite }) {
  // Memoize queue and playlist lookups to avoid O(n) operations on every render
  const queueIds = useMemo(() => new Set(queue.map(s => s.id)), [queue])
  const playlistIds = useMemo(() => new Set(playlist.map(s => s.id)), [playlist])
  const favoriteIds = useMemo(() => new Set(favoriteSongs || []), [favoriteSongs])

  return (
    <div className="backdrop-blur-xl rounded-xl overflow-hidden border w-full" style={{ backgroundColor: `${currentTheme.surfaceLight}99`, borderColor: currentTheme.border }}>
      {/* Mobile Card Layout */}
      <div className="md:hidden">
        {songs.map((song, index) => (
          <div
            key={song.id}
            onClick={() => onPlay(song)}
            className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer transition-colors group song-card ${
              currentSong?.id === song.id ? '' : ''
            }`}
            style={{
              borderColor: currentTheme.border,
              backgroundColor: currentSong?.id === song.id ? `${currentTheme.border}33` : 'transparent'
            }}
          >
            {/* Cover */}
            {imageErrors[song.id] ? (
              <div className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: currentTheme.surfaceLight }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: currentTheme.textMuted }}>
                  <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ) : (
              <img
                src={getCoverForSong(song)}
                alt={song.title}
                loading="lazy"
                decoding="async"
                className="w-12 h-12 rounded object-cover song-cover flex-shrink-0"
                onError={() => handleImageError(song.id)}
              />
            )}
            
            {/* Song Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate transition-colors" style={{ color: currentSong?.id === song.id ? currentTheme.accent : (isLightMode ? '#1F1F1F' : currentTheme.text) }}>{song.title}</p>
              {song.artist && song.artist !== 'Unknown Artist' && (
                <p className="text-xs truncate" style={{ color: isLightMode ? '#7A7A7A' : currentTheme.textMuted }}>{song.artist}</p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(song)
                  hapticSuccess()
                }}
                className={`p-2 rounded-full transition-colors mobile-action`}
                style={{
                  color: favoriteIds.has(song.id || song.title) ? '#FF3B30' : currentTheme.textMuted,
                  backgroundColor: 'transparent'
                }}
                title="Favorite"
              >
                <Heart size={18} fill={favoriteIds.has(song.id || song.title) ? '#FF3B30' : 'none'} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  addToQueue(song)
                  hapticLight()
                }}
                className={`p-2 rounded-full transition-colors mobile-action ${
                  queueIds.has(song.id) ? '' : ''
                }`}
                style={{
                  color: queueIds.has(song.id) ? '#00a8e8' : currentTheme.textMuted,
                  backgroundColor: 'transparent'
                }}
                title="Add to Queue"
              >
                <ListPlus size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  addToPlaylist(song)
                  hapticSuccess()
                }}
                className={`p-2 rounded-full transition-colors mobile-action ${
                  playlistIds.has(song.id) ? '' : ''
                }`}
                style={{
                  color: playlistIds.has(song.id) ? '#00a8e8' : currentTheme.textMuted,
                  backgroundColor: 'transparent'
                }}
                title="Add to Playlist"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Desktop Table Layout */}
      <table className="hidden md:table w-full">
        <thead>
          <tr className="text-left text-xs uppercase font-semibold tracking-wider" style={{ color: currentTheme.textMuted, borderColor: currentTheme.border }}>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2 hidden lg:table-cell">Time</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song, index) => (
            <tr
              key={song.id}
              onClick={() => onPlay(song)}
              className={`cursor-pointer transition-colors group ${
                currentSong?.id === song.id ? '' : ''
              }`}
              style={{
                backgroundColor: currentSong?.id === song.id ? `${currentTheme.border}33` : 'transparent'
              }}
            >
              <td className="px-3 py-2" style={{ color: currentTheme.textMuted }}>
                {currentSong?.id === song.id ? (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentTheme.accent }} />
                ) : (
                  <span className="text-xs transition-colors" style={{ color: currentTheme.textMuted }}>{index + 1}</span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {imageErrors[song.id] ? (
                    <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: currentTheme.surfaceLight }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: currentTheme.textMuted }}>
                        <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={getCoverForSong(song)}
                      alt={song.title}
                      loading="lazy"
                      decoding="async"
                      className="w-8 h-8 rounded object-cover song-cover group-hover:scale-103 group-hover:-translate-y-0.5 transition-all duration-200"
                      onError={() => handleImageError(song.id)}
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium transition-colors" style={{ color: currentSong?.id === song.id ? currentTheme.accent : (isLightMode ? '#1F1F1F' : currentTheme.text) }}>{song.title}</p>
                    {song.artist && song.artist !== 'Unknown Artist' && (
                      <p className="text-xs" style={{ color: isLightMode ? '#7A7A7A' : currentTheme.textMuted }}>{song.artist}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 hidden lg:table-cell text-xs" style={{ color: currentTheme.textMuted }}>{song.duration}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(song)
                      hapticSuccess()
                    }}
                    className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100`}
                    style={{ color: favoriteIds.has(song.id || song.title) ? '#FF3B30' : currentTheme.textMuted }}
                    title="Favorite"
                  >
                    <Heart size={16} fill={favoriteIds.has(song.id || song.title) ? '#FF3B30' : 'none'} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      addToQueue(song)
                      hapticLight()
                    }}
                    className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                      queueIds.has(song.id) ? 'tidal-accent opacity-100' : ''
                    }`}
                    style={{ color: queueIds.has(song.id) ? '' : currentTheme.textMuted, backgroundColor: queueIds.has(song.id) ? '' : 'transparent' }}
                    title="Add to Queue"
                  >
                    <ListPlus size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      addToPlaylist(song)
                      hapticSuccess()
                    }}
                    className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                      playlistIds.has(song.id) ? 'tidal-accent opacity-100' : ''
                    }`}
                    style={{ color: playlistIds.has(song.id) ? '' : currentTheme.textMuted }}
                    title="Add to Playlist"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function QueueList({ songs, onPlay, removeFromQueue, imageErrors, handleImageError, currentTheme, isLightMode }) {
  return (
    <div className="backdrop-blur-xl rounded-xl overflow-hidden border w-full" style={{ backgroundColor: `${currentTheme.surfaceLight}99`, borderColor: currentTheme.border }}>
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs uppercase font-semibold tracking-wider" style={{ color: currentTheme.textMuted, borderColor: currentTheme.border }}>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2 hidden lg:table-cell">Time</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song, index) => (
            <tr
              key={song.id}
              onClick={() => onPlay(song)}
              className="cursor-pointer transition-colors group"
              style={{
                backgroundColor: 'transparent'
              }}
            >
              <td className="px-3 py-2" style={{ color: currentTheme.textMuted }}>
                <span className="text-xs transition-colors" style={{ color: currentTheme.textMuted }}>{index + 1}</span>
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {imageErrors[song.id] ? (
                    <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: currentTheme.surfaceLight }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: currentTheme.textMuted }}>
                        <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={getCoverForSong(song)}
                      alt={song.title}
                      loading="lazy"
                      decoding="async"
                      className="w-8 h-8 rounded object-cover song-cover group-hover:scale-103 group-hover:-translate-y-0.5 transition-all duration-200"
                      onError={() => handleImageError(song.id)}
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium transition-colors" style={{ color: currentSong?.id === song.id ? currentTheme.accent : (isLightMode ? '#1F1F1F' : currentTheme.text) }}>{song.title}</p>
                    {song.artist && song.artist !== 'Unknown Artist' && (
                      <p className="text-xs" style={{ color: isLightMode ? '#7A7A7A' : currentTheme.textMuted }}>{song.artist}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 hidden lg:table-cell text-xs" style={{ color: currentTheme.textMuted }}>{song.duration}</td>
              <td className="px-3 py-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromQueue(song.id)
                  }}
                  className="transition-colors opacity-0 group-hover:opacity-100"
                  style={{ color: currentTheme.textMuted }}
                  title="Remove from Queue"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MainContent
