import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const ITUNES_RESULTS_FILE = process.argv[2] || 'itunes-results.json'

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('Error: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env.local')
  console.error('Get credentials from: https://developer.spotify.com/dashboard')
  process.exit(1)
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Statistics
const stats = {
  totalSongs: 0,
  spotifyMatches: 0,
  highConfidence: 0,
  mediumConfidence: 0,
  lowConfidence: 0,
  noMatch: 0
}

// Results array
const results = []

// Spotify access token
let spotifyAccessToken = null

/**
 * Get Spotify access token
 */
async function getSpotifyAccessToken() {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: 'grant_type=client_credentials'
    })
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error_description || data.error)
    }
    
    return data.access_token
  } catch (error) {
    console.error('Error getting Spotify access token:', error.message)
    throw error
  }
}

/**
 * Search Spotify API for album art
 */
async function searchSpotify(title, artist, album) {
  try {
    if (!spotifyAccessToken) {
      spotifyAccessToken = await getSpotifyAccessToken()
    }
    
    let searchTerm = title
    
    if (artist && artist !== 'Unknown Artist') {
      searchTerm = `${title} ${artist}`
    }
    
    if (album && album !== 'Unknown Album') {
      searchTerm = `${searchTerm} ${album}`
    }
    
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track&limit=10`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${spotifyAccessToken}`
      }
    })
    
    // Check response status and content-type before parsing JSON
    const contentType = response.headers.get('content-type')
    const status = response.status
    const statusText = response.statusText
    
    if (!response.ok) {
      const text = await response.text()
      console.error(`Spotify API error:`)
      console.error(`  Status: ${status} ${statusText}`)
      console.error(`  Content-Type: ${contentType}`)
      console.error(`  Request URL: ${url}`)
      console.error(`  Response: ${text}`)
      return []
    }
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error(`Spotify API returned non-JSON response:`)
      console.error(`  Status: ${status} ${statusText}`)
      console.error(`  Content-Type: ${contentType}`)
      console.error(`  Request URL: ${url}`)
      console.error(`  Response: ${text}`)
      return []
    }
    
    const data = await response.json()
    return data.tracks?.items || []
  } catch (error) {
    console.error('Error searching Spotify:', error.message)
    return []
  }
}

/**
 * Calculate confidence score for a Spotify match
 */
function calculateSpotifyConfidence(song, spotifyResult) {
  let score = 0
  
  // Title match
  if (song.title.toLowerCase() === spotifyResult.name.toLowerCase()) {
    score += 40
  } else if (song.title.toLowerCase().includes(spotifyResult.name.toLowerCase()) || 
             spotifyResult.name.toLowerCase().includes(song.title.toLowerCase())) {
    score += 20
  }
  
  // Artist match
  if (song.artist && song.artist !== 'Unknown Artist') {
    const spotifyArtist = spotifyResult.artists[0]?.name || ''
    if (song.artist.toLowerCase() === spotifyArtist.toLowerCase()) {
      score += 40
    } else if (song.artist.toLowerCase().includes(spotifyArtist.toLowerCase()) || 
               spotifyArtist.toLowerCase().includes(song.artist.toLowerCase())) {
      score += 20
    }
  }
  
  // Album match
  if (song.album && song.album !== 'Unknown Album') {
    const spotifyAlbum = spotifyResult.album?.name || ''
    if (song.album.toLowerCase() === spotifyAlbum.toLowerCase()) {
      score += 20
    } else if (song.album.toLowerCase().includes(spotifyAlbum.toLowerCase()) || 
               spotifyAlbum.toLowerCase().includes(song.album.toLowerCase())) {
      score += 10
    }
  }
  
  // Determine confidence level
  if (score >= 80) {
    return 'high'
  } else if (score >= 50) {
    return 'medium'
  } else {
    return 'low'
  }
}

/**
 * Find best cover match for a song using Spotify
 */
async function findBestSpotifyCover(song) {
  try {
    const results = await searchSpotify(song.title, song.artist, song.album)
    
    if (results.length === 0) {
      return null
    }
    
    // Score each result
    const scoredResults = results.map(result => ({
      coverUrl: result.album?.images[0]?.url || null,
      confidence: calculateSpotifyConfidence(song, result),
      trackName: result.name,
      artistName: result.artists[0]?.name || '',
      albumName: result.album?.name || ''
    })).filter(r => r.coverUrl) // Filter out results without cover art
    
    if (scoredResults.length === 0) {
      return null
    }
    
    // Sort by confidence (high > medium > low)
    const confidenceOrder = { high: 3, medium: 2, low: 1 }
    scoredResults.sort((a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence])
    
    // Return the highest confidence result
    return scoredResults[0]
  } catch (error) {
    console.error('Error finding best Spotify cover:', error.message)
    return null
  }
}

/**
 * Process a single song
 */
async function processSong(song) {
  console.log(`Processing: ${song.title} - ${song.artist}`)
  
  try {
    // Find best cover from Spotify
    const bestMatch = await findBestSpotifyCover(song)
    
    if (!bestMatch) {
      console.log('  No match found')
      stats.noMatch++
      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        currentCover: song.cover,
        spotifyCover: null,
        confidence: null,
        reason: 'No match found'
      }
    }
    
    console.log(`  Found cover (confidence: ${bestMatch.confidence})`)
    stats.spotifyMatches++
    
    if (bestMatch.confidence === 'high') {
      stats.highConfidence++
    } else if (bestMatch.confidence === 'medium') {
      stats.mediumConfidence++
    } else {
      stats.lowConfidence++
    }
    
    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      currentCover: song.cover,
      spotifyCover: bestMatch.coverUrl,
      confidence: bestMatch.confidence,
      spotifyMatch: {
        track: bestMatch.trackName,
        artist: bestMatch.artistName,
        album: bestMatch.albumName
      }
    }
  } catch (error) {
    console.error('  Error:', error.message)
    stats.noMatch++
    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      currentCover: song.cover,
      spotifyCover: null,
      confidence: null,
      reason: 'Error: ' + error.message
    }
  }
}

/**
 * Load iTunes results from file
 */
function loadITunesResults(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`iTunes results file not found: ${filePath}`)
      console.log('To generate iTunes results, run: node scripts/lookup-covers.js --force > itunes-results.json')
      return null
    }
    
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading iTunes results:', error.message)
    return null
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== Spotify Cover Lookup Report ===\n')
  
  // Load iTunes results if available
  let itunesResults = null
  itunesResults = loadITunesResults(ITUNES_RESULTS_FILE)
  
  if (itunesResults) {
    console.log(`Loaded ${itunesResults.length} iTunes results from ${ITUNES_RESULTS_FILE}\n`)
  }
  
  // Fetch all songs from Supabase
  console.log('Fetching songs from Supabase...')
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, artist, album, cover')
    .order('title', { ascending: true })
  
  if (error) {
    console.error('Error fetching songs:', error.message)
    process.exit(1)
  }
  
  stats.totalSongs = songs.length
  console.log(`Found ${songs.length} songs\n`)
  
  // Process each song
  for (const song of songs) {
    const result = await processSong(song)
    results.push(result)
  }
  
  // Print report
  console.log('\n=== Spotify Cover Lookup Report ===\n')
  
  // Group by confidence
  const highConfidence = results.filter(r => r.confidence === 'high')
  const mediumConfidence = results.filter(r => r.confidence === 'medium')
  const lowConfidence = results.filter(r => r.confidence === 'low')
  const noMatch = results.filter(r => !r.confidence)
  
  // Print high confidence matches
  if (highConfidence.length > 0) {
    console.log('--- HIGH CONFIDENCE MATCHES ---')
    highConfidence.forEach(r => {
      console.log(`\nID: ${r.id}`)
      console.log(`Title: ${r.title}`)
      console.log(`Artist: ${r.artist}`)
      console.log(`Current Cover: ${r.currentCover || 'null'}`)
      console.log(`Spotify Cover: ${r.spotifyCover}`)
      console.log(`Confidence: ${r.confidence}`)
      console.log(`Spotify Match: ${r.spotifyMatch.track} - ${r.spotifyMatch.artist} (${r.spotifyMatch.album})`)
    })
  }
  
  // Print medium confidence matches
  if (mediumConfidence.length > 0) {
    console.log('\n--- MEDIUM CONFIDENCE MATCHES ---')
    mediumConfidence.forEach(r => {
      console.log(`\nID: ${r.id}`)
      console.log(`Title: ${r.title}`)
      console.log(`Artist: ${r.artist}`)
      console.log(`Current Cover: ${r.currentCover || 'null'}`)
      console.log(`Spotify Cover: ${r.spotifyCover}`)
      console.log(`Confidence: ${r.confidence}`)
      console.log(`Spotify Match: ${r.spotifyMatch.track} - ${r.spotifyMatch.artist} (${r.spotifyMatch.album})`)
    })
  }
  
  // Print low confidence matches
  if (lowConfidence.length > 0) {
    console.log('\n--- LOW CONFIDENCE MATCHES ---')
    lowConfidence.forEach(r => {
      console.log(`\nID: ${r.id}`)
      console.log(`Title: ${r.title}`)
      console.log(`Artist: ${r.artist}`)
      console.log(`Current Cover: ${r.currentCover || 'null'}`)
      console.log(`Spotify Cover: ${r.spotifyCover}`)
      console.log(`Confidence: ${r.confidence}`)
      console.log(`Spotify Match: ${r.spotifyMatch.track} - ${r.spotifyMatch.artist} (${r.spotifyMatch.album})`)
    })
  }
  
  // Print no matches
  if (noMatch.length > 0) {
    console.log('\n--- NO MATCHES ---')
    noMatch.forEach(r => {
      console.log(`\nID: ${r.id}`)
      console.log(`Title: ${r.title}`)
      console.log(`Artist: ${r.artist}`)
      console.log(`Reason: ${r.reason}`)
    })
  }
  
  // Print summary
  console.log('\n=== Summary ===')
  console.log(`Total songs: ${stats.totalSongs}`)
  console.log(`Spotify matches: ${stats.spotifyMatches}`)
  console.log(`  High confidence: ${stats.highConfidence}`)
  console.log(`  Medium confidence: ${stats.mediumConfidence}`)
  console.log(`  Low confidence: ${stats.lowConfidence}`)
  console.log(`No match: ${stats.noMatch}`)
  
  // Comparison with iTunes if available
  if (itunesResults) {
    console.log('\n=== Comparison with iTunes ===')
    
    // Create a map of iTunes results by song ID
    const itunesMap = new Map()
    itunesResults.forEach(r => {
      if (r.id) itunesMap.set(r.id, r)
    })
    
    // Find songs where Spotify confidence is higher
    const spotifyHigher = []
    const spotifyMatchItunesNoMatch = []
    
    results.forEach(spotifyResult => {
      const itunesResult = itunesMap.get(spotifyResult.id)
      
      if (spotifyResult.confidence && itunesResult) {
        const confidenceOrder = { high: 3, medium: 2, low: 1 }
        const spotifyScore = confidenceOrder[spotifyResult.confidence] || 0
        const itunesScore = confidenceOrder[itunesResult.confidence] || 0
        
        if (spotifyScore > itunesScore) {
          spotifyHigher.push({
            id: spotifyResult.id,
            title: spotifyResult.title,
            artist: spotifyResult.artist,
            spotifyConfidence: spotifyResult.confidence,
            itunesConfidence: itunesResult.confidence
          })
        }
      }
      
      if (spotifyResult.confidence && (!itunesResult || !itunesResult.confidence)) {
        spotifyMatchItunesNoMatch.push({
          id: spotifyResult.id,
          title: spotifyResult.title,
          artist: spotifyResult.artist,
          spotifyConfidence: spotifyResult.confidence
        })
      }
    })
    
    // Print songs where Spotify confidence is higher
    if (spotifyHigher.length > 0) {
      console.log('\n--- Songs where Spotify confidence is higher ---')
      spotifyHigher.forEach(r => {
        console.log(`\nID: ${r.id}`)
        console.log(`Title: ${r.title}`)
        console.log(`Artist: ${r.artist}`)
        console.log(`Spotify confidence: ${r.spotifyConfidence}`)
        console.log(`iTunes confidence: ${r.itunesConfidence}`)
      })
    } else {
      console.log('\n--- Songs where Spotify confidence is higher ---')
      console.log('None')
    }
    
    // Print songs where Spotify found a match and iTunes did not
    if (spotifyMatchItunesNoMatch.length > 0) {
      console.log('\n--- Songs where Spotify found a match and iTunes did not ---')
      spotifyMatchItunesNoMatch.forEach(r => {
        console.log(`\nID: ${r.id}`)
        console.log(`Title: ${r.title}`)
        console.log(`Artist: ${r.artist}`)
        console.log(`Spotify confidence: ${r.spotifyConfidence}`)
      })
    } else {
      console.log('\n--- Songs where Spotify found a match and iTunes did not ---')
      console.log('None')
    }
  }
  
  console.log('\n=== Done ===')
  console.log('To compare with iTunes results, run: node scripts/lookup-covers.js --force > itunes-results.json')
  console.log('Then run: node scripts/lookup-covers-spotify.js itunes-results.json')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
