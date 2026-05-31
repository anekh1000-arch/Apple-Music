import { useEffect, useState } from 'react'

function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true)
  const [shouldAnimate, setShouldAnimate] = useState(true)

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setShouldAnimate(!prefersReducedMotion)

    // Auto-hide after animation
    const duration = prefersReducedMotion ? 300 : 1000
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 300) // Wait for fade out
    }, duration)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: shouldAnimate ? 'opacity 300ms ease-in-out' : 'none'
      }}
    >
      <div 
        className="flex flex-col items-center justify-center"
        style={{
          transform: shouldAnimate ? 'scale(1)' : 'scale(1)',
          transition: shouldAnimate ? 'transform 600ms ease-out' : 'none'
        }}
      >
        {/* Logo */}
        <div 
          className="relative"
          style={{
            animation: shouldAnimate ? 'pulse 1.5s ease-in-out infinite' : 'none'
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20 text-white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          
          {/* Glow effect */}
          <div 
            className="absolute inset-0 rounded-full blur-2xl opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
              animation: shouldAnimate ? 'glow 2s ease-in-out infinite' : 'none'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  )
}

export default SplashScreen
