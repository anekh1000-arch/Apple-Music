/**
 * Metadata Cleanup Report Script
 * 
 * Scans all songs in Supabase songs table and generates a report
 * of songs with problematic metadata.
 * 
 * This script does NOT modify data - it only generates a report.
 * 
 * Usage:
 *   node scripts/metadata-cleanup-report.js
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Statistics
const stats = {
  total: 0,
  problematic: 0,
  issues: {
    fileSizePattern: 0,
    tooLong: 0,
    videoKeywords: 0,
    unknownArtist: 0
  }
}

/**
 * Check if title looks like a file size pattern
 */
function isFileSizePattern(title) {
  // Patterns like: 1.6M, 388K, 119K, 18K, 283K
  const fileSizePattern = /^\d+(\.\d+)?[KM]$/i
  return fileSizePattern.test(title.trim())
}

/**
 * Check if title is too long
 */
function isTooLong(title) {
  return title.length > 60
}

/**
 * Check if title contains video-related keywords
 */
function hasVideoKeywords(title) {
  const keywords = [
    'Official Video',
    'Lyrics',
    'HD',
    'Full Video Song',
    'Video Song',
    'Official'
  ]
  
  return keywords.some(keyword => 
    title.toLowerCase().includes(keyword.toLowerCase())
  )
}

/**
 * Check if artist is unknown
 */
function isUnknownArtist(artist) {
  return artist === 'Unknown Artist' || artist === 'unknown' || !artist
}

/**
 * Suggest a cleaned title
 */
function suggestCleanTitle(title) {
  let cleaned = title.trim()
  
  // Remove video keywords
  const keywords = [
    'Official Video',
    'Lyrics',
    'HD',
    'Full Video Song',
    'Video Song',
    'Official',
    '(Official Video)',
    '[Official Video]'
  ]
  
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi')
    cleaned = cleaned.replace(regex, '').trim()
  })
  
  // Remove extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  // Remove leading/trailing special characters
  cleaned = cleaned.replace(/^[^\w\s]+|[^\w\s]+$/g, '').trim()
  
  // If cleaned is empty or too short, return original
  if (cleaned.length < 3) {
    return title
  }
  
  return cleaned
}

/**
 * Analyze a song and detect issues
 */
function analyzeSong(song) {
  const issues = []
  const { id, title, artist } = song
  
  if (isFileSizePattern(title)) {
    issues.push('File size pattern (e.g., 1.6M, 388K)')
    stats.issues.fileSizePattern++
  }
  
  if (isTooLong(title)) {
    issues.push(`Title too long (${title.length} chars)`)
    stats.issues.tooLong++
  }
  
  if (hasVideoKeywords(title)) {
    issues.push('Contains video keywords')
    stats.issues.videoKeywords++
  }
  
  if (isUnknownArtist(artist)) {
    issues.push('Unknown artist')
    stats.issues.unknownArtist++
  }
  
  return {
    id,
    title,
    artist,
    issues,
    suggestedTitle: issues.length > 0 ? suggestCleanTitle(title) : null
  }
}

/**
 * Main function
 */
async function generateReport() {
  console.log('=== Metadata Cleanup Report ===')
  console.log('')
  
  try {
    // Fetch all songs from Supabase
    console.log('Fetching songs from Supabase...')
    const { data, error } = await supabase
      .from('songs')
      .select('id, title, artist, album, duration')
      .order('title', { ascending: true })
    
    if (error) {
      throw error
    }
    
    stats.total = data.length
    console.log(`Found ${data.length} songs`)
    console.log('')
    
    // Analyze each song
    const problematicSongs = []
    
    for (const song of data) {
      const analysis = analyzeSong(song)
      
      if (analysis.issues.length > 0) {
        problematicSongs.push(analysis)
        stats.problematic++
      }
    }
    
    // Print report
    console.log('=== Analysis Results ===')
    console.log(`Total songs: ${stats.total}`)
    console.log(`Songs with issues: ${stats.problematic}`)
    console.log(`Songs without issues: ${stats.total - stats.problematic}`)
    console.log('')
    
    console.log('=== Issue Breakdown ===')
    console.log(`File size patterns: ${stats.issues.fileSizePattern}`)
    console.log(`Titles too long: ${stats.issues.tooLong}`)
    console.log(`Video keywords: ${stats.issues.videoKeywords}`)
    console.log(`Unknown artists: ${stats.issues.unknownArtist}`)
    console.log('')
    
    if (problematicSongs.length > 0) {
      console.log('=== Problematic Songs ===')
      console.log('')
      
      for (const song of problematicSongs) {
        console.log(`Song ID: ${song.id}`)
        console.log(`Current Title: "${song.title}"`)
        console.log(`Artist: "${song.artist}"`)
        console.log(`Issues: ${song.issues.join(', ')}`)
        
        if (song.suggestedTitle && song.suggestedTitle !== song.title) {
          console.log(`Suggested Title: "${song.suggestedTitle}"`)
        }
        
        console.log('')
      }
    } else {
      console.log('No problematic songs found!')
    }
    
    console.log('=== Report Complete ===')
    
  } catch (error) {
    console.error('Error generating report:', error)
    process.exit(1)
  }
}

// Run the report
generateReport()
