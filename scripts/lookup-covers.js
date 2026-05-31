import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FORCE_MODE = process.argv.includes('--force')

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
 * Search iTunes API for album art
 */
async function searchiTunes(title, artist, album) {
  try {
    let searchTerm = title
    
    if (artist && artist !== 'Unknown Artist') {
      searchTerm = `${title} ${artist}`
    }
    
    if (album && album !== 'Unknown Album') {
      searchTerm = `${searchTerm} ${album}`
    }
    
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&limit=10`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      return data.results
    }
    
    return []
  } catch (error) {
    console.error('Error searching iTunes:', error.message)
    return []
  }
}

/**
 * Calculate confidence score for a match
 */
function calculateConfidence(song, iTunesResult) {
  let score = 0
  
  // Title match
  if (song.title.toLowerCase() === iTunesResult.trackName.toLowerCase()) {
    score += 40
  } else if (song.title.toLowerCase().includes(iTunesResult.trackName.toLowerCase()) || 
             iTunesResult.trackName.toLowerCase().includes(song.title.toLowerCase())) {
    score += 20
  }
  
  // Artist match
  if (song.artist && song.artist !== 'Unknown Artist') {
    if (song.artist.toLowerCase() === iTunesResult.artistName.toLowerCase()) {
      score += 40
    } else if (song.artist.toLowerCase().includes(iTunesResult.artistName.toLowerCase()) || 
               iTunesResult.artistName.toLowerCase().includes(song.artist.toLowerCase())) {
      score += 20
    }
  }
  
  // Album match
  if (song.album && song.album !== 'Unknown Album') {
    if (song.album.toLowerCase() === iTunesResult.collectionName.toLowerCase()) {
      score += 20
    } else if (song.album.toLowerCase().includes(iTunesResult.collectionName.toLowerCase()) || 
               iTunesResult.collectionName.toLowerCase().includes(song.album.toLowerCase())) {
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
 * Find best cover match for a song
 */
async function findBestCover(song) {
  try {
    const results = await searchiTunes(song.title, song.artist, song.album)
    
    if (results.length === 0) {
      return null
    }
    
    // Score each result
    const scoredResults = results.map(result => ({
      coverUrl: result.artworkUrl100.replace('100x100', '600x600'),
      confidence: calculateConfidence(song, result),
      trackName: result.trackName,
      artistName: result.artistName,
      collectionName: result.collectionName
    }))
    
    // Sort by confidence (high > medium > low)
    const confidenceOrder = { high: 3, medium: 2, low: 1 }
    scoredResults.sort((a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence])
    
    // Return the highest confidence result
    return scoredResults[0]
  } catch (error) {
    console.error('Error finding best cover:', error.message)
    return null
  }
}

/**
 * Check if a cover URL is a placeholder
 */
function isPlaceholderCover(coverUrl) {
  if (!coverUrl) return true
  if (coverUrl === '') return true
  if (coverUrl.includes('picsum.photos')) return true
  if (coverUrl.includes('placeholder')) return true
  if (coverUrl.includes('default-cover')) return true
  if (coverUrl.startsWith('data:image')) return true
  return false
}

/**
 * Process a single song
 */
async function processSong(song) {
  console.log(`Processing: ${song.title} - ${song.artist}`)
  
  try {
    // Print cover value for first 5 songs (debug)
    if (results.length < 5) {
      console.log(`  Current cover: ${song.cover || 'null'}`)
    }
    
    // Skip if already has a real cover (not a placeholder) - unless in force mode
    if (!FORCE_MODE && song.cover && !isPlaceholderCover(song.cover)) {
      console.log('  Already has real cover - skipping')
      stats.noMatch++
      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        currentCover: song.cover,
        suggestedCover: null,
        confidence: null,
        reason: 'Already has real cover'
      }
    }
    
    // Find best cover
    const bestMatch = await findBestCover(song)
    
    if (!bestMatch) {
      console.log('  No match found')
      stats.noMatch++
      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        currentCover: song.cover,
        suggestedCover: null,
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
      suggestedCover: bestMatch.coverUrl,
      confidence: bestMatch.confidence,
      iTunesMatch: {
        track: bestMatch.trackName,
        artist: bestMatch.artistName,
        album: bestMatch.collectionName
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
      suggestedCover: null,
      confidence: null,
      reason: 'Error: ' + error.message
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== Online Cover Lookup Report ===\n')
  
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
  console.log('\n=== Cover Lookup Report ===\n')
  
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
      console.log(`Suggested Cover: ${r.suggestedCover}`)
      console.log(`Confidence: ${r.confidence}`)
      console.log(`iTunes Match: ${r.iTunesMatch.track} - ${r.iTunesMatch.artist} (${r.iTunesMatch.album})`)
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
      console.log(`Suggested Cover: ${r.suggestedCover}`)
      console.log(`Confidence: ${r.confidence}`)
      console.log(`iTunes Match: ${r.iTunesMatch.track} - ${r.iTunesMatch.artist} (${r.iTunesMatch.album})`)
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
      console.log(`Suggested Cover: ${r.suggestedCover}`)
      console.log(`Confidence: ${r.confidence}`)
      console.log(`iTunes Match: ${r.iTunesMatch.track} - ${r.iTunesMatch.artist} (${r.iTunesMatch.album})`)
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
  
  console.log('\n=== Done ===')
  console.log('Review the suggested covers before applying them.')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
