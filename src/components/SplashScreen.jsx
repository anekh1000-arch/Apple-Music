import { useEffect, useState } from 'react'

function SplashScreen({ onComplete, isLightMode }) {
  const [isVisible, setIsVisible] = useState(true)
  const [shouldAnimate, setShouldAnimate] = useState(true)

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setShouldAnimate(!prefersReducedMotion)

    // Auto-hide after 1500ms total
    // Logo fade in: 400ms
    // Underline draw: 500ms
    // Hold: 300ms
    // Fade out: 300ms
    const duration = prefersReducedMotion ? 0 : 1500
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 300) // Wait for fade out
    }, duration)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: isLightMode ? '#FFFFFF' : '#050505',
        opacity: isVisible ? 1 : 0,
        transition: shouldAnimate ? 'opacity 300ms ease-in-out' : 'none'
      }}
    >
      <div 
        className="flex flex-col items-center justify-center"
        style={{
          transform: shouldAnimate ? 'translateY(0)' : 'translateY(0)',
          opacity: shouldAnimate ? 1 : 1,
          transition: shouldAnimate ? 'opacity 400ms ease-out, transform 400ms ease-out' : 'none'
        }}
      >
        {/* Cursive Vocale Logo */}
        <h1 
          className="text-6xl font-bold mb-4"
          style={{
            fontFamily: "'Pacifico', 'Brush Script MT', cursive",
            color: isLightMode ? '#000000' : '#FFFFFF',
            opacity: 0,
            animation: shouldAnimate ? 'fadeInUp 400ms ease-out forwards' : 'none',
            animationDelay: '0ms'
          }}
        >
          Vocale
        </h1>

        {/* Underline */}
        <div 
          className="w-32 h-0.5 rounded-full"
          style={{
            backgroundColor: isLightMode ? '#000000' : '#FFFFFF',
            width: '0px',
            opacity: 0,
            animation: shouldAnimate ? 'underlineDraw 500ms ease-out forwards' : 'none',
            animationDelay: '400ms'
          }}
        />

        {/* Optional subtle sound wave pulse */}
        <div 
          className="absolute mt-20"
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            opacity: 0,
            animation: shouldAnimate ? 'fadeIn 500ms ease-out forwards' : 'none',
            animationDelay: '400ms'
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: '3px',
                height: '12px',
                backgroundColor: isLightMode ? '#000000' : '#FFFFFF',
                borderRadius: '2px',
                animation: shouldAnimate ? `soundWave 1s ease-in-out infinite` : 'none',
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes underlineDraw {
          from {
            width: 0px;
            opacity: 0;
          }
          to {
            width: 128px;
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes soundWave {
          0%, 100% {
            transform: scaleY(0.5);
          }
          50% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  )
}

export default SplashScreen
