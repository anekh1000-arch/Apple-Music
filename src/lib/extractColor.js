/**
 * Extract dominant color from an image URL using canvas
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string>} - Hex color code
 */
export async function extractDominantColor(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Resize for performance
        const maxSize = 50
        const scale = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Sample pixels (every 5th pixel for performance)
        const r = [], g = [], b = []
        for (let i = 0; i < data.length; i += 20) {
          r.push(data[i])
          g.push(data[i + 1])
          b.push(data[i + 2])
        }
        
        // Calculate average
        const avgR = Math.round(r.reduce((a, b) => a + b, 0) / r.length)
        const avgG = Math.round(g.reduce((a, b) => a + b, 0) / g.length)
        const avgB = Math.round(b.reduce((a, b) => a + b, 0) / b.length)
        
        // Convert to hex
        const hex = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`
        resolve(hex)
      } catch (error) {
        console.error('Error extracting color:', error)
        resolve('#000000') // Fallback to black
      }
    }
    
    img.onerror = () => {
      console.error('Error loading image for color extraction')
      resolve('#000000') // Fallback to black
    }
    
    img.src = imageUrl
  })
}
