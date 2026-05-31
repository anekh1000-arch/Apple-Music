/**
 * Bulk Music Import System
 * 
 * Imports hundreds of MP3 files into Supabase Storage and songs table.
 * 
 * Usage:
 *   node scripts/bulk-import.js <folder-path>
 * 
 * Example:
 *   node scripts/bulk-import.js ./music-files
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readdir, stat } from 'fs/promises'
import path from 'path'
import { parseFile } from 'music-metadata'
import fs from 'fs'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

// Configuration
const BATCH_SIZE = 10 // Process files in batches of 10
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const STORAGE_BUCKET = 'music'
const COVERS_BUCKET = 'covers' // Note: This bucket must be created in Supabase Storage

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Statistics
const stats = {
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  skipped: 0,
  errors: []
}

/**
 * Read all MP3 files from a directory recursively
 */
async function readMusicFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    
    if (entry.isDirectory()) {
      await readMusicFiles(fullPath, files)
    } else if (entry.name.toLowerCase().endsWith('.mp3')) {
      files.push(fullPath)
    }
  }
  
  return files
}

/**
 * Extract metadata from an MP3 file
 */
async function extractMetadata(filePath) {
  try {
    const metadata = await parseFile(filePath)
    
    const title = metadata.common.title || path.basename(filePath, '.mp3')
    const artist = metadata.common.artist || 'Unknown Artist'
    const album = metadata.common.album || 'Unknown Album'
    const duration = formatDuration(metadata.format.duration)
    
    // Extract embedded album art if available
    let coverData = null
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0]
      coverData = {
        data: picture.data,
        format: picture.format,
        mimeType: picture.format
      }
    }
    
    return {
      title,
      artist,
      album,
      duration,
      coverData
    }
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error.message)
    
    // Fallback to filename-based metadata
    const filename = path.basename(filePath, '.mp3')
    return {
      title: filename,
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: '0:00',
      coverData: null
    }
  }
}

/**
 * Format duration in seconds to MM:SS format
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Upload cover image to Supabase Storage
 */
async function uploadCover(coverData, fileName) {
  try {
    // Convert cover data to buffer
    const coverBuffer = Buffer.from(coverData.data)
    
    // Determine content type based on format
    let contentType = 'image/jpeg'
    if (coverData.format === 'image/png') {
      contentType = 'image/png'
    } else if (coverData.format === 'image/webp') {
      contentType = 'image/webp'
    }
    
    const { data, error } = await supabase.storage
      .from(COVERS_BUCKET)
      .upload(fileName, coverBuffer, {
        contentType: contentType,
        upsert: true
      })
    
    if (error) {
      throw error
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(COVERS_BUCKET)
      .getPublicUrl(fileName)
    
    return publicUrl
  } catch (error) {
    console.error('Error uploading cover:', error.message)
    return null
  }
}

/**
 * Upload file to Supabase Storage
 */
async function uploadToStorage(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      })
    
    if (error) {
      throw error
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)
    
    return publicUrl
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error.message)
    throw error
  }
}

/**
 * Check if a song with the same title and artist already exists
 */
async function checkDuplicate(title, artist) {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('id')
      .eq('title', title)
      .eq('artist', artist)
      .limit(1)
    
    if (error) {
      throw error
    }
    
    return data && data.length > 0
  } catch (error) {
    console.error(`Error checking duplicate:`, error.message)
    throw error
  }
}

/**
 * Insert song record into Supabase database
 */
async function insertSongRecord(metadata, audioUrl, coverUrl) {
  try {
    const { data, error } = await supabase
      .from('songs')
      .insert({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        duration: metadata.duration,
        cover: coverUrl,
        audio_url: audioUrl,
        quality: '320kbps'
      })
      .select()
    
    if (error) {
      throw error
    }
    
    return data[0]
  } catch (error) {
    console.error(`Error inserting song record:`, error.message)
    throw error
  }
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  const fileName = path.basename(filePath)
  console.log(`\nProcessing: ${fileName}`)
  
  try {
    // Extract metadata
    console.log('  Extracting metadata...')
    const metadata = await extractMetadata(filePath)
    console.log(`  Title: ${metadata.title}`)
    console.log(`  Artist: ${metadata.artist}`)
    console.log(`  Album: ${metadata.album}`)
    console.log(`  Duration: ${metadata.duration}`)
    
    // Check for duplicate
    console.log('  Checking for duplicate...')
    const isDuplicate = await checkDuplicate(metadata.title, metadata.artist)
    if (isDuplicate) {
      console.log('  Duplicate found - skipping')
      stats.skipped++
      return { success: true, fileName, skipped: true, reason: 'Duplicate song' }
    }
    
    // Upload to Supabase Storage
    console.log('  Uploading to Supabase Storage...')
    const storageFileName = `${metadata.artist} - ${metadata.title}.mp3`.replace(/[<>:"/\\|?*]/g, '_')
    const audioUrl = await uploadToStorage(filePath, storageFileName)
    console.log(`  Uploaded: ${audioUrl}`)
    
    // Upload cover if available
    let coverUrl = null
    if (metadata.coverData) {
      console.log('  Uploading cover image...')
      const coverFileName = `${path.basename(filePath, '.mp3')}-cover.jpg`
      coverUrl = await uploadCover(metadata.coverData, coverFileName)
      if (coverUrl) {
        console.log(`  Cover uploaded: ${coverUrl}`)
      }
    }
    
    // Use premium default placeholder if no cover
    if (!coverUrl) {
      console.log('  Using default placeholder cover')
      coverUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFhMWExYSIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iNjAiIGZpbGw9IiM4ZThlOTMiIG9wYWNpdHk9IjAuMyIvPjxwYXRoIGQ9Ik0xMzAgMTIwaDQwdjQwaC00MHpNMTQwIDEwMGgyMHY2MGgtMjB6TTEyMCAxNDBoNjB2MjBoLTYweiIgZmlsbD0iIzhlOGU5MyIgb3BhY2l0eT0iMC41Ii8+PC9zdmc+'
    }
    
    // Insert into database
    console.log('  Inserting into songs table...')
    const songRecord = await insertSongRecord(metadata, audioUrl, coverUrl)
    console.log(`  Song ID: ${songRecord.id}`)
    
    stats.succeeded++
    return { success: true, fileName, songId: songRecord.id }
  } catch (error) {
    stats.failed++
    stats.errors.push({ fileName, error: error.message })
    return { success: false, fileName, error: error.message }
  }
}

/**
 * Process files in batches
 */
async function processBatch(files) {
  const results = []
  
  for (const filePath of files) {
    const result = await processFile(filePath)
    results.push(result)
    stats.processed++
    
    console.log(`\nProgress: ${stats.processed}/${stats.total} | Success: ${stats.succeeded} | Failed: ${stats.failed}`)
  }
  
  return results
}

/**
 * Main import function
 */
async function bulkImport(folderPath) {
  console.log('=== Bulk Music Import System ===')
  console.log(`Source folder: ${folderPath}`)
  console.log(`Batch size: ${BATCH_SIZE}`)
  console.log(`Storage bucket: ${STORAGE_BUCKET}`)
  console.log('')
  
  // Read all MP3 files
  console.log('Scanning for MP3 files...')
  const files = await readMusicFiles(folderPath)
  stats.total = files.length
  
  if (files.length === 0) {
    console.log('No MP3 files found in the specified folder.')
    return
  }
  
  console.log(`Found ${files.length} MP3 files`)
  console.log('')
  
  // Process files in batches
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE)
    console.log(`\n=== Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)} ===`)
    
    await processBatch(batch)
    
    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < files.length) {
      console.log('\nWaiting 2 seconds before next batch...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  // Print final report
  console.log('\n=== Import Complete ===')
  console.log(`Total files: ${stats.total}`)
  console.log(`Processed: ${stats.processed}`)
  console.log(`Succeeded: ${stats.succeeded}`)
  console.log(`Failed: ${stats.failed}`)
  console.log(`Skipped (duplicates): ${stats.skipped}`)
  
  if (stats.errors.length > 0) {
    console.log('\n=== Errors ===')
    stats.errors.forEach(({ fileName, error }) => {
      console.log(`  ${fileName}: ${error}`)
    })
  }
}

// Main execution
const folderPath = process.argv[2]

if (!folderPath) {
  console.error('Error: Please provide a folder path')
  console.error('Usage: node scripts/bulk-import.js <folder-path>')
  process.exit(1)
}

bulkImport(folderPath).catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
