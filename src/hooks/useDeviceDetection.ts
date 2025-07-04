import { useState, useEffect } from 'react'

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  screenWidth: number
  screenHeight: number
  userAgent: string
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenWidth: 0,
    screenHeight: 0,
    userAgent: ''
  })

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // モバイルデバイスの判定
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      const isSmallScreen = screenWidth < 768

      // タブレットの判定
      const isTabletUA = /ipad|android(?!.*mobile)/i.test(userAgent)
      const isTabletScreen = screenWidth >= 768 && screenWidth < 1024

      let deviceType: 'mobile' | 'tablet' | 'desktop'
      
      if (isMobileUA || isSmallScreen) {
        deviceType = 'mobile'
      } else if (isTabletUA || isTabletScreen) {
        deviceType = 'tablet'
      } else {
        deviceType = 'desktop'
      }

      setDeviceInfo({
        type: deviceType,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        isTouchDevice: hasTouch,
        screenWidth,
        screenHeight,
        userAgent: navigator.userAgent
      })
    }

    // 初回実行
    detectDevice()
    
    // リサイズイベントリスナー
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

export default useDeviceDetection 