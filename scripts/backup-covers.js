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
const BACKUP_FILE = 'cover-backup.json'

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

/**
 * Main function
 */
async function main() {
  console.log('=== Cover Backup Script ===\n')
  
  // Fetch all songs from Supabase
  console.log('Fetching songs from Supabase...')
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, cover')
    .order('title', { ascending: true })
  
  if (error) {
    console.error('Error fetching songs:', error.message)
    process.exit(1)
  }
  
  console.log(`Found ${songs.length} songs\n`)
  
  // Prepare backup data
  const backupData = songs.map(song => ({
    id: song.id,
    title: song.title,
    cover: song.cover
  }))
  
  // Write to backup file
  console.log(`Writing backup to ${BACKUP_FILE}...`)
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupData, null, 2))
  
  console.log(`\nBackup complete: ${BACKUP_FILE}`)
  console.log(`Total songs backed up: ${backupData.length}`)
  
  // Show summary
  const withCovers = backupData.filter(s => s.cover).length
  const withoutCovers = backupData.filter(s => !s.cover).length
  
  console.log(`\nSummary:`)
  console.log(`  Songs with covers: ${withCovers}`)
  console.log(`  Songs without covers: ${withoutCovers}`)
  
  console.log('\n=== Done ===')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
