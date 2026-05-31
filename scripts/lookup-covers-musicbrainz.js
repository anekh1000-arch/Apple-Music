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
const MUSICBRAINZ_USER_AGENT = 'AuraMusicCoverLookup/1.0 (https://github.com/yourusername/aura)'
const REQUEST_DELAY = 1000 // 1 second between requests (MusicBrainz rate limit)
const SAVE_RESULTS = process.argv.includes('--save')
const RESULTS_FILE = 'musicbrainz-results.json'

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Statistics
const stats = {
  totalSongs: 0,
  coversFound: 0,
  highConfidence: 0,
  mediumConfidence: 0,
  lowConfidence: 0,
  noMatch: 0
}

// Results array
const results = []

/**
 * Delay function for rate limiting
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Search MusicBrainz API for recordings
 */
async function searchMusicBrainz(title, artist) {
  try {
    let query = `recording:${encodeURIComponent(title)}`
    
    if (artist && artist !== 'Unknown Artist') {
      query += ` AND artist:${encodeURIComponent(artist)}`
    }
    
    const url = `https://musicbrainz.org/ws/2/recording?query=${query}&limit=10&fmt=json`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': MUSICBRAINZ_USER_AGENT,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error(`MusicBrainz API error: ${response.status} ${response.statusText}`)
      return []
    }
    
    const data = await response.json()
    return data.recordings || []
  } catch (error) {
    console.error('Error searching MusicBrainz:', error.message)
    return []
  }
}

/**
 * Get cover art from Cover Art Archive
 */
async function getCoverArtArchive(releaseId) {
  try {
    const url = `https://coverartarchive.org/release/${releaseId}/front-500`
    const response = await fetch(url, {
      headers: {
        'User-Agent': MUSICBRAINZ_USER_AGENT
      }
    })
    
    if (!response.ok) {
      return null
    }
    
    return url
  } catch (error) {
    console.error('Error fetching cover art:', error.message)
    return null
  }
}

/**
 * Calculate confidence score for a MusicBrainz match
 */
function calculateConfidence(song, musicbrainzResult) {
  let score = 0
  
  // Title match
  if (song.title.toLowerCase() === musicbrainzResult.title.toLowerCase()) {
    score += 40
  } else if (song.title.toLowerCase().includes(musicbrainzResult.title.toLowerCase()) || 
             musicbrainzResult.title.toLowerCase().includes(song.title.toLowerCase())) {
    score += 20
  }
  
  // Artist match
  if (song.artist && song.artist !== 'Unknown Artist') {
    const mbArtist = musicbrainzResult['artist-credit']?.[0]?.name || ''
    if (song.artist.toLowerCase() === mbArtist.toLowerCase()) {
      score += 40
    } else if (song.artist.toLowerCase().includes(mbArtist.toLowerCase()) || 
               mbArtist.toLowerCase().includes(song.artist.toLowerCase())) {
      score += 20
    }
  }
  
  // Release match
  if (song.album && song.album !== 'Unknown Album') {
    const mbRelease = musicbrainzResult.releases?.[0]?.title || ''
    if (song.album.toLowerCase() === mbRelease.toLowerCase()) {
      score += 20
    } else if (song.album.toLowerCase().includes(mbRelease.toLowerCase()) || 
               mbRelease.toLowerCase().includes(song.album.toLowerCase())) {
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
 * Find best cover match for a song using MusicBrainz
 */
async function findBestMusicBrainzCover(song) {
  try {
    const recordings = await searchMusicBrainz(song.title, song.artist)
    
    if (recordings.length === 0) {
      return null
    }
    
    // Score each result and get cover art
    const scoredResults = []
    
    for (const recording of recordings) {
      const releaseId = recording.releases?.[0]?.id
      if (!releaseId) continue
      
      const coverUrl = await getCoverArtArchive(releaseId)
      if (!coverUrl) continue
      
      const confidence = calculateConfidence(song, recording)
      
      scoredResults.push({
        coverUrl,
        confidence,
        trackName: recording.title,
        artistName: recording['artist-credit']?.[0]?.name || '',
        releaseName: recording.releases?.[0]?.title || ''
      })
    }
    
    if (scoredResults.length === 0) {
      return null
    }
    
    // Sort by confidence (high > medium > low)
    const confidenceOrder = { high: 3, medium: 2, low: 1 }
    scoredResults.sort((a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence])
    
    // Return the highest confidence result
    return scoredResults[0]
  } catch (error) {
    console.error('Error finding best MusicBrainz cover:', error.message)
    return null
  }
}

/**
 * Process a single song
 */
async function processSong(song) {
  console.log(`Processing: ${song.title} - ${song.artist}`)
  
  try {
    // Find best cover from MusicBrainz
    const bestMatch = await findBestMusicBrainzCover(song)
    
    if (!bestMatch) {
      console.log('  No match found')
      stats.noMatch++
      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        currentCover: song.cover,
        musicbrainzCover: null,
        confidence: null,
        reason: 'No match found'
      }
    }
    
    console.log(`  Found cover (confidence: ${bestMatch.confidence})`)
    stats.coversFound++
    
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
      musicbrainzCover: bestMatch.coverUrl,
      confidence: bestMatch.confidence,
      musicbrainzMatch: {
        track: bestMatch.trackName,
        artist: bestMatch.artistName,
        release: bestMatch.releaseName
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
      musicbrainzCover: null,
      confidence: null,
      reason: 'Error: ' + error.message
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== MusicBrainz Cover Lookup Report ===\n')
  console.log('Note: This script respects MusicBrainz rate limits (1 request/second)')
  console.log('Processing may take some time...\n')
  
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
  
  // Process each song with rate limiting
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i]
    const result = await processSong(song)
    results.push(result)
    
    // Add delay between requests (except for the last one)
    if (i < songs.length - 1) {
      await delay(REQUEST_DELAY)
    }
  }
  
  // Print report
  console.log('\n=== MusicBrainz Cover Lookup Report ===\n')
  
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
      console.log(`MusicBrainz Cover: ${r.musicbrainzCover}`)
      console.log(`Confidence: ${r.confidence}`)
      console.log(`MusicBrainz Match: ${r.musicbrainzMatch.track} - ${r.musicbrainzMatch.artist} (${r.musicbrainzMatch.release})`)
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
      console.log(`MusicBrainz Cover: ${r.musicbrainzCover}`)
      console.log(`Confidence: ${r.confidence}`)
      console.log(`MusicBrainz Match: ${r.musicbrainzMatch.track} - ${r.musicbrainzMatch.artist} (${r.musicbrainzMatch.release})`)
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
      console.log(`MusicBrainz Cover: ${r.musicbrainzCover}`)
      console.log(`Confidence: ${r.confidence}`)
      console.log(`MusicBrainz Match: ${r.musicbrainzMatch.track} - ${r.musicbrainzMatch.artist} (${r.musicbrainzMatch.release})`)
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
  console.log(`Covers found: ${stats.coversFound}`)
  console.log(`  High confidence: ${stats.highConfidence}`)
  console.log(`  Medium confidence: ${stats.mediumConfidence}`)
  console.log(`  Low confidence: ${stats.lowConfidence}`)
  console.log(`No match: ${stats.noMatch}`)
  
  // Save results to file if --save flag is provided
  if (SAVE_RESULTS) {
    console.log(`\nSaving results to ${RESULTS_FILE}...`)
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2))
    console.log(`Results saved to ${RESULTS_FILE}`)
  }
  
  console.log('\n=== Done ===')
  console.log('Report only - no covers were updated')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
