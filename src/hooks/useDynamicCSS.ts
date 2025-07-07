import { useEffect } from 'react'
import { useDeviceDetection } from './useDeviceDetection'

export const useDynamicCSS = () => {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection()

  useEffect(() => {
    // Remove all existing dynamic CSS links
    const existingLinks = document.querySelectorAll('link[data-dynamic-css]')
    existingLinks.forEach(link => link.remove())

    // Import device-specific CSS modules dynamically
    const loadDeviceCSS = async () => {
      try {
        if (isMobile || isTablet) {
          console.log('[useDynamicCSS] Loading mobile CSS')
          await import('../styles/mobile.css')
        } else if (isDesktop) {
          console.log('[useDynamicCSS] Loading desktop CSS')
          await import('../styles/desktop.css')
        }
      } catch (error) {
        console.error('[useDynamicCSS] Failed to load device-specific CSS:', error)
      }
    }

    loadDeviceCSS()

    // No cleanup needed for CSS modules as Vite handles it
  }, [isMobile, isTablet, isDesktop])

  return { isMobile, isTablet, isDesktop }
}

export default useDynamicCSS