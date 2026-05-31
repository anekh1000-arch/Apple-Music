import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration
const MUSICBRAINZ_FILE = process.argv[2] || 'musicbrainz-results.json'
const ITUNES_FILE = process.argv[3] || 'itunes-results.json'

console.log('=== Cover Comparison Report ===\n')

/**
 * Load results from JSON file
 */
function loadResults(filePath, sourceName) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`${sourceName} file not found: ${filePath}`)
      return null
    }
    
    const data = fs.readFileSync(filePath, 'utf-8')
    const results = JSON.parse(data)
    console.log(`Loaded ${results.length} results from ${filePath} (${sourceName})`)
    return results
  } catch (error) {
    console.error(`Error loading ${sourceName}:`, error.message)
    return null
  }
}

/**
 * Main function
 */
async function main() {
  // Load MusicBrainz results
  const musicbrainzResults = loadResults(MUSICBRAINZ_FILE, 'MusicBrainz')
  
  // Load iTunes results
  const itunesResults = loadResults(ITUNES_FILE, 'iTunes')
  
  if (!musicbrainzResults && !itunesResults) {
    console.error('\nError: No results files found')
    console.log('To generate MusicBrainz results: node scripts/lookup-covers-musicbrainz.js --save')
    console.log('To generate iTunes results: node scripts/lookup-covers.js --force > itunes-results.json')
    process.exit(1)
  }
  
  console.log('')
  
  // Create maps by song ID
  const mbMap = new Map()
  if (musicbrainzResults) {
    musicbrainzResults.forEach(r => {
      if (r.id) mbMap.set(r.id, r)
    })
  }
  
  const itunesMap = new Map()
  if (itunesResults) {
    itunesResults.forEach(r => {
      if (r.id) itunesMap.set(r.id, r)
    })
  }
  
  // Get high confidence matches from both
  const mbHigh = musicbrainzResults ? musicbrainzResults.filter(r => r.confidence === 'high') : []
  const itunesHigh = itunesResults ? itunesResults.filter(r => r.confidence === 'high') : []
  
  // Compare high confidence matches
  console.log('=== HIGH CONFIDENCE COMPARISON ===\n')
  
  const highComparison = []
  
  // Songs with high confidence in both
  const bothHigh = []
  if (musicbrainzResults && itunesResults) {
    musicbrainzResults.forEach(mbResult => {
      if (mbResult.confidence === 'high') {
        const itunesResult = itunesMap.get(mbResult.id)
        if (itunesResult && itunesResult.confidence === 'high') {
          bothHigh.push({
            id: mbResult.id,
            title: mbResult.title,
            artist: mbResult.artist,
            mbCover: mbResult.musicbrainzCover,
            itunesCover: itunesResult.suggestedCover,
            mbConfidence: mbResult.confidence,
            itunesConfidence: itunesResult.confidence
          })
        }
      }
    })
  }
  
  if (bothHigh.length > 0) {
    console.log('--- Songs with HIGH confidence in BOTH ---')
    bothHigh.forEach(r => {
      console.log(`\nID: ${r.id}`)
      console.log(`Title: ${r.title}`)
      console.log(`Artist: ${r.artist}`)
      console.log(`MusicBrainz Cover: ${r.mbCover}`)
      console.log(`iTunes Cover: ${r.itunesCover}`)
      console.log(`MusicBrainz Confidence: ${r.mbConfidence}`)
      console.log(`iTunes Confidence: ${r.itunesConfidence}`)
    })
  } else {
    console.log('--- Songs with HIGH confidence in BOTH ---')
    console.log('None')
  }
  
  // Songs with high confidence in MusicBrainz only
  const mbHighOnly = mbHigh.filter(r => !itunesMap.has(r.id) || itunesMap.get(r.id).confidence !== 'high')
  
  if (mbHighOnly.length > 0) {
    console.log('\n--- Songs with HIGH confidence in MusicBrainz ONLY ---')
    mbHighOnly.forEach(r => {
      console.log(`\nID: ${r.id}`)
      console.log(`Title: ${r.title}`)
      console.log(`Artist: ${r.artist}`)
      console.log(`MusicBrainz Cover: ${r.musicbrainzCover}`)
      console.log(`MusicBrainz Confidence: ${r.confidence}`)
    })
  } else {
    console.log('\n--- Songs with HIGH confidence in MusicBrainz ONLY ---')
    console.log('None')
  }
  
  // Songs with high confidence in iTunes only
  const itunesHighOnly = itunesHigh.filter(r => !mbMap.has(r.id) || mbMap.get(r.id).confidence !== 'high')
  
  if (itunesHighOnly.length > 0) {
    console.log('\n--- Songs with HIGH confidence in iTunes ONLY ---')
    itunesHighOnly.forEach(r => {
      console.log(`\nID: ${r.id}`)
      console.log(`Title: ${r.title}`)
      console.log(`Artist: ${r.artist}`)
      console.log(`iTunes Cover: ${r.suggestedCover}`)
      console.log(`iTunes Confidence: ${r.confidence}`)
    })
  } else {
    console.log('\n--- Songs with HIGH confidence in iTunes ONLY ---')
    console.log('None')
  }
  
  // Songs found by MusicBrainz but not iTunes
  const mbOnly = []
  if (musicbrainzResults) {
    musicbrainzResults.forEach(mbResult => {
      if (mbResult.confidence && (!itunesResults || !itunesMap.has(mbResult.id) || !itunesMap.get(mbResult.id).confidence)) {
        mbOnly.push({
          id: mbResult.id,
          title: mbResult.title,
          artist: mbResult.artist,
          mbCover: mbResult.musicbrainzCover,
          mbConfidence: mbResult.confidence
        })
      }
    })
  }
  
  if (mbOnly.length > 0) {
    console.log('\n--- Songs found by MusicBrainz but NOT iTunes ---')
    mbOnly.forEach(r => {
      console.log(`\nID: ${r.id}`)
      console.log(`Title: ${r.title}`)
      console.log(`Artist: ${r.artist}`)
      console.log(`MusicBrainz Cover: ${r.mbCover}`)
      console.log(`MusicBrainz Confidence: ${r.mbConfidence}`)
    })
  } else {
    console.log('\n--- Songs found by MusicBrainz but NOT iTunes ---')
    console.log('None')
  }
  
  // Songs found by iTunes but not MusicBrainz
  const itunesOnly = []
  if (itunesResults) {
    itunesResults.forEach(itunesResult => {
      if (itunesResult.confidence && (!musicbrainzResults || !mbMap.has(itunesResult.id) || !mbMap.get(itunesResult.id).confidence)) {
        itunesOnly.push({
          id: itunesResult.id,
          title: itunesResult.title,
          artist: itunesResult.artist,
          itunesCover: itunesResult.suggestedCover,
          itunesConfidence: itunesResult.confidence
        })
      }
    })
  }
  
  if (itunesOnly.length > 0) {
    console.log('\n--- Songs found by iTunes but NOT MusicBrainz ---')
    itunesOnly.forEach(r => {
      console.log(`\nID: ${r.id}`)
      console.log(`Title: ${r.title}`)
      console.log(`Artist: ${r.artist}`)
      console.log(`iTunes Cover: ${r.itunesCover}`)
      console.log(`iTunes Confidence: ${r.itunesConfidence}`)
    })
  } else {
    console.log('\n--- Songs found by iTunes but NOT MusicBrainz ---')
    console.log('None')
  }
  
  // Summary
  console.log('\n=== Summary ===')
  console.log(`MusicBrainz high confidence: ${mbHigh.length}`)
  console.log(`iTunes high confidence: ${itunesHigh.length}`)
  console.log(`Both high confidence: ${bothHigh.length}`)
  console.log(`MusicBrainz only: ${mbOnly.length}`)
  console.log(`iTunes only: ${itunesOnly.length}`)
  
  console.log('\n=== Done ===')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
