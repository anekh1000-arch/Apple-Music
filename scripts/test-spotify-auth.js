import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

// Configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

console.log('=== Spotify Authentication Test ===\n')

// Check if credentials are set
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.log('Authentication: FAILED')
  console.log('Access token received: NO')
  console.log('Token expiry time: N/A')
  console.log('\nError: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env.local')
  console.log('Get credentials from: https://developer.spotify.com/dashboard')
  process.exit(1)
}

console.log('Credentials loaded: YES')
console.log(`Client ID: ${SPOTIFY_CLIENT_ID.substring(0, 8)}...`)
console.log(`Client Secret: ${SPOTIFY_CLIENT_SECRET.substring(0, 8)}...`)
console.log('')

// Request access token
async function testAuthentication() {
  try {
    console.log('Requesting access token...')
    
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
      console.log('Authentication: FAILED')
      console.log('Access token received: NO')
      console.log('Token expiry time: N/A')
      console.log(`\nError: ${data.error_description || data.error}`)
      process.exit(1)
    }
    
    console.log('Authentication: SUCCESS')
    console.log('Access token received: YES')
    console.log(`Token type: ${data.token_type}`)
    console.log(`Token expiry time: ${data.expires_in} seconds`)
    console.log(`Token preview: ${data.access_token.substring(0, 20)}...`)
    
    console.log('\n=== Test Complete ===')
  } catch (error) {
    console.log('Authentication: FAILED')
    console.log('Access token received: NO')
    console.log('Token expiry time: N/A')
    console.log(`\nError: ${error.message}`)
    process.exit(1)
  }
}

testAuthentication()
