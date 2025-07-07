import { useEffect } from 'react'
import { useDeviceDetection } from './useDeviceDetection'

export const useDynamicCSS = () => {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection()

  useEffect(() => {
    // Remove all existing dynamic CSS links
    const existingLinks = document.querySelectorAll('link[data-dynamic-css]')
    existingLinks.forEach(link => link.remove())

    // Always load base styles
    const baseLink = document.createElement('link')
    baseLink.rel = 'stylesheet'
    baseLink.href = '/src/styles/base.css'
    baseLink.setAttribute('data-dynamic-css', 'base')
    document.head.appendChild(baseLink)

    // Load device-specific styles
    const deviceLink = document.createElement('link')
    deviceLink.rel = 'stylesheet'
    deviceLink.setAttribute('data-dynamic-css', 'device')
    
    if (isMobile || isTablet) {
      deviceLink.href = '/src/styles/mobile.css'
      console.log('[useDynamicCSS] Loading mobile CSS')
    } else if (isDesktop) {
      deviceLink.href = '/src/styles/desktop.css'
      console.log('[useDynamicCSS] Loading desktop CSS')
    }
    
    document.head.appendChild(deviceLink)

    // Cleanup function
    return () => {
      const dynamicLinks = document.querySelectorAll('link[data-dynamic-css]')
      dynamicLinks.forEach(link => link.remove())
    }
  }, [isMobile, isTablet, isDesktop])

  return { isMobile, isTablet, isDesktop }
}

export default useDynamicCSS