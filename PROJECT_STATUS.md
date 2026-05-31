# Project Status

## Current App Architecture

**Tech Stack:**
- React 18.3.1 with Vite 5.2.0
- TailwindCSS 3.4.3 for styling
- Lucide React 0.263.1 for icons
- @supabase/supabase-js 2.106.2 for backend
- music-metadata 7.14.0 for audio metadata extraction

**Component Structure:**
- `App.jsx` - Main application container with state management
- `Sidebar.jsx` - Desktop sidebar and mobile bottom navigation
- `MainContent.jsx` - Main content area with multiple views
- `Player.jsx` - Bottom mini player bar
- `FullscreenPlayer.jsx` - Fullscreen player view
- `SplashScreen.jsx` - Animated splash screen with Apple logo

**State Management:**
- React hooks (useState, useEffect, useRef, useCallback)
- Local storage persistence for:
  - Theme preferences
  - Appearance (light/dark mode)
  - Listening statistics
  - Playback sessions
  - Recently played songs

**Audio System:**
- HTML5 Audio element via useRef
- Custom progress tracking and seeking
- Volume control with mute toggle
- Error handling for failed audio loads
- Playback session restoration on app load

## Current UI State

**Theme System:**
- 4 color themes: midnight-black, forest-noir, wine-noir, velvet-noir
- Light/dark mode toggle
- Dynamic accent colors per theme
- Theme migration support (removed violet-eclipse, sunset-gold)

**Layout:**
- Desktop: Fixed sidebar (256px) + main content area
- Mobile: Bottom navigation bar + full-width content
- Responsive breakpoints at 768px (md)

**Visual Features:**
- Dynamic blurred background based on current song cover (dark mode only)
- Splash screen with animated Apple logo
- Smooth transitions and animations
- Glassmorphism effects with backdrop-blur
- Custom range slider styling

**Views:**
- Home: Featured song, discover section, recently added, continue listening, library stats
- Search: Search input with filtered results
- Library: Full song list
- Queue: Up next queue management
- Favorites: Favorite tracks (placeholder implementation)
- Settings: Theme and appearance selectors

## Supabase Setup

**Configuration:**
- Client initialized in `src/lib/supabase.js`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Graceful fallback to local songs.js if not configured
- Service role key support for admin operations

**Data Fetching:**
- Fetches from 'songs' table on app mount
- Field mapping: `audio_url` → `audioUrl`
- Ordered by title ascending
- Error handling with fallback to local data
- FORCE_LOCAL_MODE flag for testing (currently false)

**Database Schema (inferred):**
- songs table with fields: id, title, artist, album, duration, cover, audio_url, quality
- Storage buckets: 'music' for audio files, 'covers' for album art

## Music Import Scripts

**Available Scripts:**
1. `bulk-import.js` - Bulk import MP3 files to Supabase
   - Extracts metadata using music-metadata
   - Uploads audio to 'music' bucket
   - Uploads embedded covers to 'covers' bucket
   - Inserts records into songs table
   - Duplicate detection
   - Batch processing (10 files per batch)

2. `lookup-covers.js` - iTunes API cover lookup
   - Searches iTunes API for album art
   - Confidence scoring (high/medium/low)
   - Skips existing real covers (unless --force)
   - Generates report before applying

3. `lookup-covers-spotify.js` - Spotify API cover lookup
4. `lookup-covers-musicbrainz.js` - MusicBrainz API cover lookup
5. `update-covers.js` - Updates cover URLs in database
6. `backup-covers.js` - Backs up current cover URLs
7. `compare-covers.js` - Compares cover sources
8. `metadata-cleanup-report.js` - Metadata cleanup reports
9. `test-spotify-auth.js` - Spotify authentication testing

**Features:**
- Metadata extraction from MP3 files
- Embedded album art extraction
- Multiple API sources for cover lookup
- Confidence-based matching
- Batch processing with rate limiting

## Mobile Layout Changes Already Present

**Navigation:**
- Bottom navigation bar (fixed position, z-30)
- 5 tabs: Home, Search, Library, Favorites, Settings
- Safe area inset support for notched devices
- Active state highlighting with accent color

**Swipe Gestures:**
- Horizontal swipe detection for tab navigation
- Touch event listeners (touchstart, touchmove, touchend)
- 70px swipe threshold
- Excludes sliders and horizontally scrollable elements
- Slide animations with direction indicators

**Responsive Design:**
- Mobile-first approach with md: breakpoints
- Conditional rendering for desktop/mobile
- Touch-friendly button sizes (min 44px)
- Responsive grid layouts (2-5 columns)
- Horizontal scrolling for song lists

**Player:**
- Mini player positioned above bottom nav on mobile
- Fullscreen player with slide animations
- Touch-optimized controls

## Features Currently Working

**Core Features:**
- ✅ Audio playback with play/pause/next/previous
- ✅ Progress bar with seeking
- ✅ Volume control with mute toggle
- ✅ Queue system (add, remove, play from queue)
- ✅ Playlist management (add, remove)
- ✅ Recently played tracking (limited to 10)
- ✅ Playback session persistence (saves position, queue)
- ✅ Session restoration on app reload
- ✅ Search functionality (title, artist, album)
- ✅ Theme switching (4 color themes)
- ✅ Light/dark mode toggle
- ✅ Listening statistics tracking
- ✅ Featured song (morning/evening picks)
- ✅ Discover section (daily random songs)
- ✅ Library statistics (songs, artists, albums, duration)
- ✅ Mobile swipe navigation
- ✅ Responsive design
- ✅ Splash screen with animation
- ✅ Dynamic blurred background
- ✅ Image error handling
- ✅ Audio error handling with user feedback

**Supabase Integration:**
- ✅ Data fetching from Supabase
- ✅ Fallback to local songs.js
- ✅ Field mapping (snake_case to camelCase)
- ✅ Error handling

**Import Scripts:**
- ✅ Bulk import with metadata extraction
- ✅ iTunes API cover lookup with confidence scoring
- ✅ Multiple cover lookup sources
- ✅ Batch processing

## Known Issues

**None explicitly documented in code.**

Potential areas for improvement:
- Favorites view is a placeholder (shows first 4 songs only)
- No actual favorites persistence mechanism
- Queue tab exists but queue management could be enhanced
- No shuffle/repeat functionality
- No gapless playback
- No audio visualization
- No lyrics display

## Pending Features We Planned

**High Priority:**
- ❌ Swipe down to close fullscreen player (currently only button close)
- ❌ Recently Played section (data tracked but no dedicated view)
- ❌ Continue Listening section (displayed in home but could be enhanced)
- ❌ Dynamic album background (currently only blurred background, could be more dynamic)

**Medium Priority:**
- ❌ Lock screen controls using Media Session API
- ❌ Sleep Timer
- ❌ Long press song actions (context menu)
- ❌ Library performance optimization (for large libraries)

**Nice to Have:**
- ❌ Shuffle and repeat modes
- ❌ Audio visualization
- ❌ Lyrics display
- ❌ Gapless playback
- ❌ Equalizer
- ❌ Offline support
- ❌ Download for offline playback
- ❌ Social sharing
- ❌ Playlist folders
- ❌ Smart playlists
- ❌ Radio/autoplay features
