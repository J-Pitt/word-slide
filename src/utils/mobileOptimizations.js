// Mobile optimization utilities for Word Slide game

// Feature detection for mobile capabilities
export const mobileFeatures = {
  // Check if device supports touch
  hasTouch: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  
  // Check if device is mobile
  isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  
  // Check if device supports haptic feedback
  hasHaptics: () => 'vibrate' in navigator,
  
  // Check if device supports CSS transforms
  hasTransforms: () => {
    const testEl = document.createElement('div')
    return 'transform' in testEl.style || 'webkitTransform' in testEl.style
  },
  
  // Get device pixel ratio for high-DPI displays
  getPixelRatio: () => window.devicePixelRatio || 1,
  
  // Check if device is in landscape mode
  isLandscape: () => window.innerWidth > window.innerHeight,
  
  // Get safe area insets for notched devices
  getSafeAreaInsets: () => {
    const computedStyle = getComputedStyle(document.documentElement)
    return {
      top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top')) || 0,
      right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right')) || 0,
      bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom')) || 0,
      left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left')) || 0
    }
  }
}

// Touch event optimization
export class TouchOptimizer {
  constructor() {
    this.touchStartTime = 0
    this.touchStartPos = { x: 0, y: 0 }
    this.lastTouchTime = 0
    this.touchVelocity = { x: 0, y: 0 }
    this.isScrolling = false
    this.scrollThreshold = 10
    this.velocityThreshold = 0.5
  }

  // Debounced touch start handler
  handleTouchStart(e, callback) {
    const now = Date.now()
    if (now - this.lastTouchTime < 16) return // 60fps limit
    
    this.lastTouchTime = now
    this.touchStartTime = now
    this.touchStartPos = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
    this.isScrolling = false
    
    if (callback) callback(e)
  }

  // Optimized touch move handler with velocity calculation
  handleTouchMove(e, callback) {
    const now = Date.now()
    if (now - this.lastTouchTime < 16) return // 60fps limit
    
    this.lastTouchTime = now
    const currentPos = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
    
    // Calculate velocity
    const deltaTime = now - this.touchStartTime
    if (deltaTime > 0) {
      this.touchVelocity = {
        x: (currentPos.x - this.touchStartPos.x) / deltaTime,
        y: (currentPos.y - this.touchStartPos.y) / deltaTime
      }
    }
    
    // Detect scrolling
    const deltaX = Math.abs(currentPos.x - this.touchStartPos.x)
    const deltaY = Math.abs(currentPos.y - this.touchStartPos.y)
    
    if (deltaY > this.scrollThreshold && deltaY > deltaX) {
      this.isScrolling = true
    }
    
    if (callback) callback(e, this.touchVelocity, this.isScrolling)
  }

  // Touch end handler with momentum
  handleTouchEnd(e, callback) {
    const now = Date.now()
    const touchDuration = now - this.touchStartTime
    
    if (callback) callback(e, {
      velocity: this.touchVelocity,
      duration: touchDuration,
      isScrolling: this.isScrolling
    })
  }
}

// Performance optimization utilities
export const performanceUtils = {
  // Throttle function calls
  throttle: (func, limit) => {
    let inThrottle
    return function() {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // Debounce function calls
  debounce: (func, wait) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  // Request animation frame with fallback
  requestAnimationFrame: (callback) => {
    if (window.requestAnimationFrame) {
      return window.requestAnimationFrame(callback)
    } else {
      return setTimeout(callback, 16) // 60fps fallback
    }
  },

  // Cancel animation frame with fallback
  cancelAnimationFrame: (id) => {
    if (window.cancelAnimationFrame) {
      window.cancelAnimationFrame(id)
    } else {
      clearTimeout(id)
    }
  }
}

// Haptic feedback utilities
export const hapticUtils = {
  // Light haptic feedback
  light: () => {
    if (mobileFeatures.hasHaptics()) {
      navigator.vibrate(10)
    }
  },

  // Medium haptic feedback
  medium: () => {
    if (mobileFeatures.hasHaptics()) {
      navigator.vibrate(50)
    }
  },

  // Heavy haptic feedback
  heavy: () => {
    if (mobileFeatures.hasHaptics()) {
      navigator.vibrate(100)
    }
  },

  // Success pattern
  success: () => {
    if (mobileFeatures.hasHaptics()) {
      navigator.vibrate([50, 50, 50])
    }
  },

  // Error pattern
  error: () => {
    if (mobileFeatures.hasHaptics()) {
      navigator.vibrate([100, 50, 100])
    }
  }
}

// Responsive design utilities
export const responsiveUtils = {
  // Calculate optimal tile size based on screen dimensions
  calculateTileSize: (screenWidth, screenHeight, boardCols, boardRows) => {
    const isLandscape = screenWidth > screenHeight
    const availableWidth = isLandscape ? screenHeight * 0.8 : screenWidth * 0.9
    const availableHeight = isLandscape ? screenWidth * 0.6 : screenHeight * 0.4
    
    const maxTileWidth = availableWidth / boardCols
    const maxTileHeight = availableHeight / boardRows
    
    return Math.min(maxTileWidth, maxTileHeight, 60) // Cap at 60px
  },

  // Calculate optimal gap size
  calculateGapSize: (tileSize) => {
    return Math.max(1, Math.floor(tileSize * 0.05)) // 5% of tile size, minimum 1px
  },

  // Get viewport dimensions
  getViewportDimensions: () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      isLandscape: window.innerWidth > window.innerHeight
    }
  },

  // Handle orientation change
  onOrientationChange: (callback) => {
    const handleOrientationChange = () => {
      setTimeout(callback, 100) // Small delay to ensure dimensions are updated
    }
    
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }
}

// Memory management utilities
export const memoryUtils = {
  // Object pool for frequently created objects
  createObjectPool: (createFn, resetFn, initialSize = 10) => {
    const pool = []
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      pool.push(createFn())
    }
    
    return {
      get: () => {
        if (pool.length > 0) {
          return pool.pop()
        }
        return createFn()
      },
      
      release: (obj) => {
        if (resetFn) resetFn(obj)
        pool.push(obj)
      },
      
      clear: () => {
        pool.length = 0
      }
    }
  },

  // Cleanup utility for event listeners
  createCleanupManager: () => {
    const listeners = []
    
    return {
      add: (element, event, handler, options) => {
        element.addEventListener(event, handler, options)
        listeners.push({ element, event, handler, options })
      },
      
      remove: (element, event, handler) => {
        element.removeEventListener(event, handler)
        const index = listeners.findIndex(l => 
          l.element === element && l.event === event && l.handler === handler
        )
        if (index > -1) {
          listeners.splice(index, 1)
        }
      },
      
      cleanup: () => {
        listeners.forEach(({ element, event, handler, options }) => {
          element.removeEventListener(event, handler, options)
        })
        listeners.length = 0
      }
    }
  }
}

// Browser compatibility utilities
export const compatibilityUtils = {
  // Add CSS custom properties fallback
  addCSSFallbacks: () => {
    const style = document.createElement('style')
    style.textContent = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top, 0px);
        --safe-area-inset-right: env(safe-area-inset-right, 0px);
        --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
        --safe-area-inset-left: env(safe-area-inset-left, 0px);
      }
      
      /* Touch target minimum size */
      .touch-target {
        min-width: 44px;
        min-height: 44px;
      }
      
      /* Prevent text selection on touch */
      .no-select {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
      
      /* Smooth scrolling */
      html {
        -webkit-overflow-scrolling: touch;
      }
    `
    document.head.appendChild(style)
  },

  // Polyfill for requestIdleCallback
  polyfillRequestIdleCallback: () => {
    if (!window.requestIdleCallback) {
      window.requestIdleCallback = (callback, options) => {
        const timeout = options?.timeout || 50
        return setTimeout(() => {
          callback({
            didTimeout: false,
            timeRemaining: () => 16 // Assume 16ms available
          })
        }, 1)
      }
    }
    
    if (!window.cancelIdleCallback) {
      window.cancelIdleCallback = (id) => {
        clearTimeout(id)
      }
    }
  }
}

export default {
  mobileFeatures,
  TouchOptimizer,
  performanceUtils,
  hapticUtils,
  responsiveUtils,
  memoryUtils,
  compatibilityUtils
}
