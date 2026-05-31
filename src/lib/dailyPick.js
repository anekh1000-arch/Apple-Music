// Date-based random selection utility for daily song picks
// Uses today's date as a seed to ensure consistent picks throughout the day

function getDailySeed() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Simple seeded random number generator
function seededRandom(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const x = Math.sin(hash) * 10000
  return x - Math.floor(x)
}

// Get a random song based on today's date
function getDailyPick(songs) {
  if (!songs || songs.length === 0) return null
  
  const seed = getDailySeed()
  const randomIndex = Math.floor(seededRandom(seed) * songs.length)
  return songs[randomIndex]
}

// Get multiple random songs based on today's date (for recommendations)
function getDailyRecommendations(songs, count = 6, excludeId = null) {
  if (!songs || songs.length === 0) return []
  
  const seed = getDailySeed()
  const recommendations = []
  const availableSongs = excludeId ? songs.filter(s => s.id !== excludeId) : [...songs]
  
  // Use different seeds for each recommendation to avoid duplicates
  for (let i = 0; i < count && availableSongs.length > 0; i++) {
    const itemSeed = `${seed}-${i}`
    const randomIndex = Math.floor(seededRandom(itemSeed) * availableSongs.length)
    recommendations.push(availableSongs[randomIndex])
    availableSongs.splice(randomIndex, 1)
  }
  
  return recommendations
}

export { getDailyPick, getDailyRecommendations, getDailySeed }
