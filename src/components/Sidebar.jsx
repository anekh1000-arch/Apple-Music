import { Home, Search, Music, Heart, Settings, ListMusic } from 'lucide-react'
import { memo, useState } from 'react'
import { hapticSelection } from '../lib/haptics'
import { getCoverForSong } from '../utils/covers'

const MOBILE_MENU_ITEMS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'library', icon: Music, label: 'Library' },
  { id: 'favorites', icon: Heart, label: 'Favorites' },
  { id: 'settings', icon: Settings, label: 'Settings' },
]

function Sidebar({ view, setView, playlist, removeFromPlaylist, currentTheme, isLightMode, themeName, isMidnightBlackTheme, getMidnightBlackContrast }) {
  const [imageErrors, setImageErrors] = useState({})
  const [hoveredDesktopItem, setHoveredDesktopItem] = useState(null)

  const handleImageError = (songId) => {
    setImageErrors(prev => ({ ...prev, [songId]: true }))
  }
  
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'library', icon: Music, label: 'Library' },
    { id: 'queue', icon: ListMusic, label: 'Queue' },
    { id: 'favorites', icon: Heart, label: 'Favorites' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  // Get contrast colors for Midnight Black theme
  const isMidnightBlack = isMidnightBlackTheme && isMidnightBlackTheme(themeName)
  const contrastColors = isMidnightBlack ? getMidnightBlackContrast() : null

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col" style={{ backgroundColor: currentTheme.bg, borderRightColor: currentTheme.border }}>
        <div className="p-6">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" style={{ color: currentTheme.text }}>
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        </div>
        
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = view === item.id
              const isHovered = hoveredDesktopItem === item.id
              const activeDesktopBg = isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.10)'
              const hoverDesktopBg = isLightMode ? 'rgba(0, 0, 0, 0.045)' : 'rgba(255, 255, 255, 0.075)'
              const desktopItemColor = isActive
                ? currentTheme.text
                : currentTheme.textMuted
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setView(item.id)
                      hapticSelection()
                    }}
                    onMouseEnter={() => setHoveredDesktopItem(item.id)}
                    onMouseLeave={() => setHoveredDesktopItem(null)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg relative overflow-hidden"
                    style={{
                      color: desktopItemColor,
                      backgroundColor: isActive ? activeDesktopBg : (isHovered ? hoverDesktopBg : 'transparent'),
                      border: 'none',
                      opacity: isActive ? 1 : 0.65,
                      transform: isActive ? 'translateX(2px)' : (isHovered ? 'translateX(3px)' : 'translateX(0)'),
                      transition: 'background-color 0.22s ease, color 0.22s ease, transform 0.18s ease, opacity 0.18s ease'
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '6px',
                        width: '3px',
                        height: '22px',
                        borderRadius: '999px',
                        background: 'currentColor',
                        opacity: isActive ? 0.9 : 0,
                        transform: isActive ? 'translateX(0)' : 'translateX(-4px)',
                        transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease'
                      }}
                    />
                    <Icon size={16} style={{
                      color: desktopItemColor,
                      opacity: isActive ? 1 : 0.9,
                      transform: isHovered && !isActive ? 'translateX(1px)' : 'translateX(0)',
                      transition: 'color 0.22s ease, opacity 0.22s ease, transform 0.18s ease'
                    }} />
                    <span className="text-sm" style={{
                      color: desktopItemColor,
                      opacity: isActive ? 1 : 0.95,
                      transform: isHovered && !isActive ? 'translateX(1px)' : 'translateX(0)',
                      transition: 'color 0.22s ease, opacity 0.22s ease, transform 0.18s ease'
                    }}>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {playlist.length > 0 && (
          <div className="p-4 border-t backdrop-blur-lg" style={{ borderColor: currentTheme.border, backgroundColor: `${currentTheme.bg}66` }}>
            <h3 className="text-xs uppercase mb-3 font-semibold tracking-wider" style={{ color: currentTheme.textMuted }}>
              Playlist
            </h3>
            <ul className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
              {playlist.map((song, index) => (
                <li key={song.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors cursor-pointer group" style={{ backgroundColor: 'transparent' }}>
                  {imageErrors[song.id] ? (
                    <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: currentTheme.surfaceLight }}>
                      <span className="text-xs" style={{ color: currentTheme.textMuted }}>No Cover</span>
                    </div>
                  ) : (
                    <img
                      src={getCoverForSong(song)}
                      alt={song.title}
                      loading="lazy"
                      decoding="async"
                      className="w-8 h-8 rounded object-cover song-cover group-hover:scale-110 transition-transform duration-300"
                      onError={() => handleImageError(song.id)}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate transition-colors" style={{ color: currentTheme.text }}>{song.title}</p>
                    <p className="text-xs truncate" style={{ color: currentTheme.textMuted }}>{song.artist}</p>
                  </div>
                  <button
                    onClick={() => removeFromPlaylist(song.id)}
                    className="transition-colors opacity-0 group-hover:opacity-100"
                    style={{ color: currentTheme.textMuted }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <MobileBottomNav view={view} setView={setView} isLightMode={isLightMode} />
    </>
  )
}

const MobileBottomNav = memo(function MobileBottomNav({ view, setView, isLightMode }) {
  const activeIndex = Math.max(0, MOBILE_MENU_ITEMS.findIndex(item => item.id === view))

  return (
    <nav className={`mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-30 ${isLightMode ? '' : 'dark'}`}>
      <div
        className="mobile-nav-indicator"
        style={{
          width: `${100 / MOBILE_MENU_ITEMS.length}%`,
          transform: `translateX(${activeIndex * 100}%)`
        }}
      />
      {MOBILE_MENU_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = view === item.id
        const itemColor = isActive
          ? (isLightMode ? '#111111' : '#FFFFFF')
          : (isLightMode ? '#6E6E73' : '#8A8A93')

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (view !== item.id) {
                setView(item.id)
              }
            }}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            style={{ color: itemColor }}
          >
            <Icon className="mobile-nav-icon" size={23} style={{ display: 'block', color: itemColor }} />
            <span className="mobile-nav-label" style={{ color: itemColor }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
})

export default Sidebar
