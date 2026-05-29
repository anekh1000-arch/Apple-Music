import { songs } from '../data/songs'
import { Play, Plus, Clock } from 'lucide-react'

function MainContent({ view, searchQuery, setSearchQuery, onPlay, currentSong, addToPlaylist, playlist }) {
  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderContent = () => {
    switch (view) {
      case 'home':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-2">Home</h2>
            <p className="text-[#8e8e93] mb-4 text-xs">Discover new music</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {songs.slice(0, 6).map((song) => (
                <div
                  key={song.id}
                  onClick={() => onPlay(song)}
                  className="group cursor-pointer"
                >
                  <div className="relative mb-2">
                    <img
                      src={song.cover}
                      alt={song.title}
                      className="w-full aspect-square object-cover rounded shadow"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                      <div className="w-6 h-6 tidal-accent-bg rounded-full flex items-center justify-center">
                        <Play size={12} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-medium truncate mb-0.5">{song.title}</p>
                  <p className="text-[10px] text-[#8e8e93] truncate">{song.artist}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Recently Played</h2>
              <SongList songs={songs} onPlay={onPlay} currentSong={currentSong} addToPlaylist={addToPlaylist} playlist={playlist} />
            </div>
          </div>
        )
      case 'search':
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Search</h2>
            <p className="text-[#8e8e93] mb-6 text-sm">Find your favorite music</p>
            <input
              type="text"
              placeholder="Search songs, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white placeholder-[#8e8e93] focus:outline-none focus:border-[#00a8e8] transition-colors text-sm"
            />
            {searchQuery ? (
              <div className="mt-6">
                <SongList songs={filteredSongs} onPlay={onPlay} currentSong={currentSong} addToPlaylist={addToPlaylist} playlist={playlist} />
              </div>
            ) : (
              <div className="text-center py-20 text-[#8e8e93]">
                <p className="text-sm">Search for music</p>
              </div>
            )}
          </div>
        )
      case 'library':
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Your Library</h2>
            <p className="text-[#8e8e93] mb-6 text-sm">Your personal music collection</p>
            <SongList songs={songs} onPlay={onPlay} currentSong={currentSong} addToPlaylist={addToPlaylist} playlist={playlist} />
          </div>
        )
      case 'favorites':
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Favorites</h2>
            <p className="text-[#8e8e93] mb-6 text-sm">Your favorite tracks</p>
            <SongList songs={songs.slice(0, 4)} onPlay={onPlay} currentSong={currentSong} addToPlaylist={addToPlaylist} playlist={playlist} />
          </div>
        )
      case 'settings':
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Settings</h2>
            <p className="text-[#8e8e93] mb-6 text-sm">Customize your experience</p>
            <div className="bg-[#1a1a1a] rounded-lg p-4 max-w-2xl">
              <p className="text-[#8e8e93] text-sm">Settings coming soon...</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <main className="flex-1 overflow-y-auto bg-black p-6 pb-28">
      {renderContent()}
    </main>
  )
}

function SongList({ songs, onPlay, currentSong, addToPlaylist, playlist }) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="text-left text-[#8e8e93] text-xs uppercase border-b border-[#2a2a2a]">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2 hidden md:table-cell">Album</th>
            <th className="px-3 py-2 hidden lg:table-cell">Time</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song, index) => (
            <tr
              key={song.id}
              onClick={() => onPlay(song)}
              className={`hover:bg-[#2a2a2a] cursor-pointer transition-colors ${
                currentSong?.id === song.id ? 'bg-[#2a2a2a]' : ''
              }`}
            >
              <td className="px-3 py-2 text-[#8e8e93]">
                {currentSong?.id === song.id ? (
                  <div className="w-2 h-2 tidal-accent-bg rounded-full" />
                ) : (
                  <span className="text-[#8e8e93] text-xs">{index + 1}</span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="w-8 h-8 rounded object-cover"
                  />
                  <div>
                    <p className={`text-sm font-medium ${currentSong?.id === song.id ? 'tidal-accent' : ''}`}>{song.title}</p>
                    <p className="text-xs text-[#8e8e93]">{song.artist}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 text-[#8e8e93] hidden md:table-cell text-xs">{song.album}</td>
              <td className="px-3 py-2 text-[#8e8e93] hidden lg:table-cell text-xs">{song.duration}</td>
              <td className="px-3 py-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addToPlaylist(song)
                  }}
                  className={`p-1 rounded hover:bg-[#2a2a2a] transition-colors ${
                    playlist.find(s => s.id === song.id) ? 'tidal-accent' : 'text-[#8e8e93]'
                  }`}
                >
                  <Plus size={18} />
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
