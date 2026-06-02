# Vocale

A minimal, Tidal-inspired music streaming application built with React, Vite, and TailwindCSS.

## Features

- **Queue System**: Add songs to queue, play from queue, remove from queue
- **Recently Played**: Automatically tracks recently played songs (limited to 10)
- **Playlist Management**: Add songs to playlist, remove from playlist
- **Link Testing**: Test audio URLs for browser compatibility in Settings
- **Error Handling**: Shows loading state and error messages for failed audio loads

## Adding Music Files

### Local Music Files (Recommended)

1. Place your audio files in the `public/music/` folder
2. Reference them in `src/data/songs.js` using the path: `/music/song-name.mp3`
3. Example:
   ```javascript
   {
     id: 1,
     title: "My Song",
     artist: "My Artist",
     album: "My Album",
     duration: "3:45",
     cover: "/covers/album-1.jpg",
     audioUrl: "/music/my-song.mp3"
   }
   ```

### Album Cover Images

1. Place your cover images in the `public/covers/` folder
2. Reference them in `src/data/songs.js` using the path: `/covers/image-name.jpg`
3. Recommended size: 500x500 or 800x800 square
4. Supported formats: JPG, PNG, WebP
5. You can also use external URLs for covers
6. Example:
   ```javascript
   {
     cover: "/covers/album-1.jpg"  // Local file
     // or
     cover: "https://example.com/cover.jpg"  // External URL
   }
   ```

### Supported Audio Formats

- **MP3** (up to 320kbps recommended)
- **AAC/M4A** (256kbps recommended)
- **FLAC** (lossless, but large files and browser support may vary)

### Recommended Audio Quality

For Vocale-like quality personal streaming:

- **Best balance**: AAC/M4A 256kbps or MP3 320kbps
  - Excellent sound quality
  - Reasonable file sizes
  - Universal browser support

- **Lossless**: FLAC
  - Highest possible quality
  - Large file sizes
  - Browser support may vary (check compatibility)

### Cloud Storage

You can use Cloudflare R2 or similar CDN services for hosting audio files:

- audioUrl can point to Cloudflare R2 public URLs
- Recommended file naming: `artist-song-title.mp3`
- Example: `https://your-r2-bucket.com/music/artist-song-title.mp3`

### Important Notes

- **MEGA share links are NOT supported**: MEGA public share links are not direct playable audio URLs and will not work in the browser
- **Cloud storage preview pages**: Google Drive share pages, Dropbox share links, and similar preview pages are not supported
- **Direct URLs only**: Only direct file URLs that the browser can play directly are supported
- **Local files**: Using local files in the `public/music/` folder is the recommended approach

## Development

```bash
npm install
npm run dev
```

## Stack

- React
- Vite
- TailwindCSS
- Lucide React Icons

## Design

- Minimal, Tidal-inspired UI with cyan accent (#00a8e8)
- Dark theme with black background
- Apple logo branding
