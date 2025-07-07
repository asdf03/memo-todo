import { useState, useEffect } from 'react'

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  type: 'mobile' | 'tablet' | 'desktop'
}

export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    type: 'desktop'
  })

  useEffect(() => {
    const detectDevice = () => {
      const isTouchDevice = 
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0

      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
      
      const screenWidth = window.innerWidth
      const isMobileScreen = screenWidth <= 768
      const isTabletScreen = screenWidth > 768 && screenWidth <= 1024
      
      const isMobile = (isMobileUA || (isTouchDevice && isMobileScreen)) && !isTabletUA
      const isTablet = isTabletUA || (isTouchDevice && isTabletScreen)
      const isDesktop = !isMobile && !isTablet
      
      let type: 'mobile' | 'tablet' | 'desktop' = 'desktop'
      if (isMobile) type = 'mobile'
      else if (isTablet) type = 'tablet'
      
      const newDeviceInfo: DeviceInfo = {
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        type
      }
      
      setDeviceInfo(newDeviceInfo)
    }

    detectDevice()

    const handleResize = () => {
      detectDevice()
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return deviceInfo
}