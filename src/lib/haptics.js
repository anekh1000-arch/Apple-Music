/**
 * Haptic feedback utility for mobile devices
 * Uses Vibration API with graceful degradation
 */

// Haptic patterns (milliseconds)
const HAPTIC_PATTERNS = {
  light: [10],      // Light tap for navigation
  medium: [20],     // Medium for playback controls
  success: [10, 30, 10], // Success pattern
  selection: [15],  // Selection feedback
  error: [10, 50, 10] // Error feedback
}

/**
 * Check if haptic feedback is supported
 */
export const isHapticSupported = () => {
  return 'vibrate' in navigator
}

/**
 * Trigger haptic feedback
 * @param {string} type - Type of haptic feedback ('light', 'medium', 'success', 'selection', 'error')
 */
export const triggerHaptic = (type) => {
  if (!isHapticSupported()) return
  
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
 * Success feedback for completed actions
 */
export const hapticSuccess = () => triggerHaptic('success')

/**
 * Selection feedback for tab changes
 */
export const hapticSelection = () => triggerHaptic('selection')

/**
 * Error feedback
 */
export const hapticError = () => triggerHaptic('error')
