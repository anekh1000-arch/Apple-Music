/**
 * Haptic feedback utility for mobile devices
 * Uses Vibration API with graceful degradation
 */

// Premium haptic patterns (milliseconds)
const HAPTIC_PATTERNS = {
  light: 10,           // Light tap for navigation
  medium: 20,          // Medium for playback controls
  heavy: 35,           // Heavy impact (rarely used)
  success: [10, 40, 10], // Success pattern
  selection: 8        // Selection feedback
}

/**
 * Check if haptic feedback is enabled in settings
 */
export const isHapticEnabled = () => {
  try {
    if (typeof window === 'undefined') return true
    const setting = localStorage.getItem('hapticFeedbackEnabled')
    return setting !== 'false' // Default to true if not set
  } catch {
    return true // Default to true if localStorage fails
  }
}

/**
 * Check if haptic feedback is supported
 */
export const isHapticSupported = () => {
  if (typeof window === 'undefined') return false
  return 'vibrate' in navigator
}

/**
 * Trigger haptic feedback
 * @param {string} type - Type of haptic feedback ('light', 'medium', 'heavy', 'success', 'selection')
 */
export const triggerHaptic = (type) => {
  if (!isHapticSupported()) return
  if (!isHapticEnabled()) return

  const pattern = HAPTIC_PATTERNS[type]
  if (pattern) {
    try {
      navigator.vibrate(pattern)
    } catch (error) {
      // Silently fail if haptics are not supported
      console.debug('Haptic feedback not supported:', error)
    }
  }
}

/**
 * Light impact for taps and navigation
 */
export const hapticLight = () => triggerHaptic('light')

/**
 * Medium impact for playback controls
 */
export const hapticMedium = () => triggerHaptic('medium')

/**
 * Heavy impact (rarely used)
 */
export const hapticHeavy = () => triggerHaptic('heavy')

/**
 * Success feedback for completed actions
 */
export const hapticSuccess = () => triggerHaptic('success')

/**
 * Selection feedback for tab changes
 */
export const hapticSelection = () => triggerHaptic('selection')
