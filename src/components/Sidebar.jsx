import { Home, Search, Music, Heart, Settings } from 'lucide-react'

function Sidebar({ view, setView, playlist, removeFromPlaylist }) {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'library', icon: Music, label: 'Library' },
    { id: 'favorites', icon: Heart, label: 'Favorites' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside className="w-64 bg-black border-r border-[#1a1a1a] flex flex-col">
      <div className="p-6">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      </div>
      
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={() => setView(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    view === item.id
                      ? 'bg-[#00a8e8] text-white'
                      : 'text-[#8e8e93] hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {playlist.length > 0 && (
        <div className="p-4 border-t border-[#1a1a1a]">
          <h3 className="text-xs text-[#8e8e93] uppercase mb-3">
            Playlist
          </h3>
          <ul className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
            {playlist.map((song) => (
              <li key={song.id} className="flex items-center gap-3 hover:bg-[#1a1a1a] rounded-lg p-2 transition-colors cursor-pointer">
                <img
                  src={song.cover}
                  alt={song.title}
                  className="w-8 h-8 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{song.title}</p>
                  <p className="text-xs text-[#8e8e93] truncate">{song.artist}</p>
                </div>
                <button
                  onClick={() => removeFromPlaylist(song.id)}
                  className="text-[#8e8e93] hover:text-white transition-colors"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
