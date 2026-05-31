import { createClient } from '@supabase/supabase-js'
import { parseFile } from 'music-metadata'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const COVERS_BUCKET = 'covers'

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Statistics
const stats = {
  totalScanned: 0,
  coversFound: 0,
  coversUploaded: 0,
  songsUpdated: 0,
  skipped: 0,
  failed: 0,
  errors: []
}

/**
 * Get all MP3 files from a directory recursively
 */
function getMp3Files(dir) {
  const files = []
  
  if (!fs.existsSync(dir)) {
    console.error(`Error: Directory ${dir} does not exist`)
    return files
  }
  
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      files.push(...getMp3Files(fullPath))
    } else if (item.toLowerCase().endsWith('.mp3')) {
      files.push(fullPath)
    }
  }
  
  return files
}

/**
 * Extract embedded album art from MP3 file
 */
async function extractCover(filePath) {
  try {
    const metadata = await parseFile(filePath)
    
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0]
      return {
        data: picture.data,
        format: picture.format,
        mimeType: picture.format
      }
    }
    
    return null
  } catch (error) {
    console.error(`Error extracting cover from ${filePath}:`, error.message)
    return null
  }
}

/**
 * Upload cover image to Supabase Storage
 */
async function uploadCover(coverData, fileName) {
  try {
    const coverBuffer = Buffer.from(coverData.data)
    
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
 * Find song in database by title and artist
 */
async function findSong(title, artist) {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('id, title, artist, cover')
      .eq('title', title)
      .eq('artist', artist)
      .limit(1)
    
    if (error) {
      throw error
    }
    
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Error finding song:', error.message)
    return null
  }
}

/**
 * Find song in database by filename (fallback)
 */
async function findSongByFilename(filename) {
  try {
    const title = path.basename(filename, '.mp3')
    const { data, error } = await supabase
      .from('songs')
      .select('id, title, artist, cover')
      .ilike('title', `%${title}%`)
      .limit(1)
    
    if (error) {
      throw error
    }
    
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Error finding song by filename:', error.message)
    return null
  }
}

/**
 * Update song cover in database
 */
async function updateSongCover(songId, coverUrl) {
  try {
    const { data, error } = await supabase
      .from('songs')
      .update({ cover: coverUrl })
      .eq('id', songId)
      .select()
    
    if (error) {
      throw error
    }
    
    return data[0]
  } catch (error) {
    console.error('Error updating song cover:', error.message)
    throw error
  }
}

/**
 * Process a single MP3 file
 */
async function processFile(filePath) {
  const fileName = path.basename(filePath)
  console.log(`\nProcessing: ${fileName}`)
  
  try {
    // Extract metadata for matching
    console.log('  Extracting metadata...')
    const metadata = await parseFile(filePath)
    const title = metadata.common.title || path.basename(filePath, '.mp3')
    const artist = metadata.common.artist || 'Unknown Artist'
    console.log(`  Title: ${title}`)
    console.log(`  Artist: ${artist}`)
    
    // Extract cover
    console.log('  Extracting cover...')
    const coverData = await extractCover(filePath)
    
    if (!coverData) {
      console.log('  No embedded cover found - skipping')
      stats.skipped++
      return { success: true, fileName, skipped: true, reason: 'No embedded cover' }
    }
    
    stats.coversFound++
    console.log('  Cover found')
    
    // Find song in database by title and artist
    console.log('  Finding song in database...')
    let song = await findSong(title, artist)
    
    // Fallback to filename match
    if (!song) {
      console.log('  Not found by title/artist, trying filename match...')
      song = await findSongByFilename(fileName)
    }
    
    if (!song) {
      console.log('  Song not found in database - skipping')
      stats.skipped++
      return { success: true, fileName, skipped: true, reason: 'Song not in database' }
    }
    
    console.log(`  Found song: ${song.title} (ID: ${song.id})`)
    
    // Upload cover
    console.log('  Uploading cover to Supabase Storage...')
    const coverFileName = `${path.basename(filePath, '.mp3')}-cover.jpg`
    const coverUrl = await uploadCover(coverData, coverFileName)
    
    if (!coverUrl) {
      console.log('  Failed to upload cover - skipping')
      stats.failed++
      stats.errors.push({ fileName, error: 'Failed to upload cover' })
      return { success: false, fileName, error: 'Failed to upload cover' }
    }
    
    console.log(`  Cover uploaded: ${coverUrl}`)
    stats.coversUploaded++
    
    // Update song cover
    console.log('  Updating song cover in database...')
    await updateSongCover(song.id, coverUrl)
    console.log('  Song cover updated')
    stats.songsUpdated++
    
    return { success: true, fileName, songId: song.id, coverUrl }
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
  }
  
  return results
}

/**
 * Main function
 */
async function main() {
  console.log('=== Cover Update Script ===\n')
  
  // Get music directory from command line
  const musicDir = process.argv[2]
  
  if (!musicDir) {
    console.error('Error: Please provide the music directory path')
    console.error('Usage: node scripts/update-covers.js <music-directory>')
    process.exit(1)
  }
  
  console.log(`Scanning directory: ${musicDir}`)
  
  // Get all MP3 files
  const files = getMp3Files(musicDir)
  stats.totalScanned = files.length
  
  if (files.length === 0) {
    console.log('No MP3 files found')
    return
  }
  
  console.log(`Found ${files.length} MP3 files\n`)
  
  // Process all files
  await processBatch(files)
  
  // Print final report
  console.log('\n=== Final Report ===')
  console.log(`Total scanned: ${stats.totalScanned}`)
  console.log(`Covers found: ${stats.coversFound}`)
  console.log(`Covers uploaded: ${stats.coversUploaded}`)
  console.log(`Songs updated: ${stats.songsUpdated}`)
  console.log(`Skipped: ${stats.skipped}`)
  console.log(`Failed: ${stats.failed}`)
  
  if (stats.errors.length > 0) {
    console.log('\nErrors:')
    stats.errors.forEach(({ fileName, error }) => {
      console.log(`  ${fileName}: ${error}`)
    })
  }
  
  console.log('\n=== Done ===')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
