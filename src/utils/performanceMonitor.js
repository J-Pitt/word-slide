// Performance monitoring utilities for mobile optimization

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      frameRate: 0,
      memoryUsage: 0,
      touchLatency: 0,
      renderTime: 0,
      gameStateUpdates: 0
    }
    
    this.frameCount = 0
    this.lastFrameTime = performance.now()
    this.touchStartTime = 0
    this.renderStartTime = 0
    
    this.isMonitoring = false
    this.monitoringInterval = null
    
    // Performance thresholds
    this.thresholds = {
      minFrameRate: 30, // Minimum acceptable FPS
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxTouchLatency: 100, // 100ms
      maxRenderTime: 16 // 16ms (60fps)
    }
  }

  // Start performance monitoring
  startMonitoring() {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics()
      this.checkPerformance()
    }, 1000) // Check every second
    
    // Monitor frame rate
    this.monitorFrameRate()
    
    console.log('Performance monitoring started')
  }

  // Stop performance monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    console.log('Performance monitoring stopped')
  }

  // Monitor frame rate using requestAnimationFrame
  monitorFrameRate() {
    if (!this.isMonitoring) return
    
    const now = performance.now()
    const deltaTime = now - this.lastFrameTime
    
    this.frameCount++
    
    if (deltaTime >= 1000) { // Update every second
      this.metrics.frameRate = Math.round((this.frameCount * 1000) / deltaTime)
      this.frameCount = 0
      this.lastFrameTime = now
    }
    
    requestAnimationFrame(() => this.monitorFrameRate())
  }

  // Update performance metrics
  updateMetrics() {
    // Memory usage (if available)
    if (performance.memory) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize
    }
    
    // Game state updates (custom metric)
    this.metrics.gameStateUpdates = this.getGameStateUpdateCount()
  }

  // Check if performance is within acceptable thresholds
  checkPerformance() {
    const warnings = []
    
    if (this.metrics.frameRate < this.thresholds.minFrameRate) {
      warnings.push(`Low frame rate: ${this.metrics.frameRate} FPS`)
    }
    
    if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      warnings.push(`High memory usage: ${Math.round(this.metrics.memoryUsage / 1024 / 1024)}MB`)
    }
    
    if (this.metrics.touchLatency > this.thresholds.maxTouchLatency) {
      warnings.push(`High touch latency: ${this.metrics.touchLatency}ms`)
    }
    
    if (this.metrics.renderTime > this.thresholds.maxRenderTime) {
      warnings.push(`Slow render time: ${this.metrics.renderTime}ms`)
    }
    
    if (warnings.length > 0) {
      console.warn('Performance warnings:', warnings)
      this.onPerformanceWarning(warnings)
    }
  }

  // Handle performance warnings
  onPerformanceWarning(warnings) {
    // Could trigger performance optimizations here
    // For example, reduce animation quality, disable effects, etc.
    
    // Emit custom event for the app to handle
    window.dispatchEvent(new CustomEvent('performanceWarning', {
      detail: { warnings, metrics: this.metrics }
    }))
  }

  // Record touch start time
  recordTouchStart() {
    this.touchStartTime = performance.now()
  }

  // Record touch end and calculate latency
  recordTouchEnd() {
    if (this.touchStartTime > 0) {
      this.metrics.touchLatency = performance.now() - this.touchStartTime
      this.touchStartTime = 0
    }
  }

  // Record render start time
  recordRenderStart() {
    this.renderStartTime = performance.now()
  }

  // Record render end and calculate render time
  recordRenderEnd() {
    if (this.renderStartTime > 0) {
      this.metrics.renderTime = performance.now() - this.renderStartTime
      this.renderStartTime = 0
    }
  }

  // Get current performance metrics
  getMetrics() {
    return { ...this.metrics }
  }

  // Get game state update count (custom implementation)
  getGameStateUpdateCount() {
    // This would be implemented based on your game's state management
    // For now, return a placeholder
    return window.__wordslideGameStateUpdates || 0
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      frameRate: 0,
      memoryUsage: 0,
      touchLatency: 0,
      renderTime: 0,
      gameStateUpdates: 0
    }
    this.frameCount = 0
    this.lastFrameTime = performance.now()
  }

  // Get performance report
  getPerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      devicePixelRatio: window.devicePixelRatio,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      metrics: this.getMetrics(),
      thresholds: this.thresholds
    }
  }
}

// Web Vitals monitoring
class WebVitalsMonitor {
  constructor() {
    this.vitals = {
      lcp: null, // Largest Contentful Paint
      fid: null, // First Input Delay
      cls: null, // Cumulative Layout Shift
      fcp: null, // First Contentful Paint
      ttfb: null // Time to First Byte
    }
  }

  // Monitor Core Web Vitals
  startMonitoring() {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.vitals.lcp = lastEntry.startTime
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.warn('LCP monitoring not supported:', e)
      }

      // FID - First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            this.vitals.fid = entry.processingStart - entry.startTime
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        console.warn('FID monitoring not supported:', e)
      }

      // CLS - Cumulative Layout Shift
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.vitals.cls = clsValue
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.warn('CLS monitoring not supported:', e)
      }
    }
  }

  // Get Web Vitals
  getVitals() {
    return { ...this.vitals }
  }
}

// Network monitoring
class NetworkMonitor {
  constructor() {
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    this.metrics = {
      effectiveType: this.connection?.effectiveType || 'unknown',
      downlink: this.connection?.downlink || 0,
      rtt: this.connection?.rtt || 0,
      saveData: this.connection?.saveData || false
    }
  }

  // Monitor network changes
  startMonitoring() {
    if (this.connection) {
      this.connection.addEventListener('change', () => {
        this.metrics = {
          effectiveType: this.connection.effectiveType,
          downlink: this.connection.downlink,
          rtt: this.connection.rtt,
          saveData: this.connection.saveData
        }
        
        // Emit network change event
        window.dispatchEvent(new CustomEvent('networkChange', {
          detail: this.metrics
        }))
      })
    }
  }

  // Get network metrics
  getMetrics() {
    return { ...this.metrics }
  }

  // Check if connection is slow
  isSlowConnection() {
    return this.metrics.effectiveType === 'slow-2g' || 
           this.metrics.effectiveType === '2g' ||
           this.metrics.downlink < 1
  }

  // Check if data saver is enabled
  isDataSaverEnabled() {
    return this.metrics.saveData
  }
}

// Create global instances
const performanceMonitor = new PerformanceMonitor()
const webVitalsMonitor = new WebVitalsMonitor()
const networkMonitor = new NetworkMonitor()

// Export utilities
export {
  PerformanceMonitor,
  WebVitalsMonitor,
  NetworkMonitor,
  performanceMonitor,
  webVitalsMonitor,
  networkMonitor
}

export default {
  performanceMonitor,
  webVitalsMonitor,
  networkMonitor
}
