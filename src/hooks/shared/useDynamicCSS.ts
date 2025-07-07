import { useEffect } from 'react'
import { useDeviceDetection } from './useDeviceDetection'

export const useDynamicCSS = () => {
  const { isMobile, isTouchDevice } = useDeviceDetection()
  
  useEffect(() => {
    // 既存のスタイルシートをクリア（開発時のホットリロード対応）
    const existingStyles = document.querySelectorAll('link[data-dynamic-css]')
    existingStyles.forEach(style => style.remove())
    
    // ベーススタイルを読み込み
    const baseLink = document.createElement('link')
    baseLink.rel = 'stylesheet'
    baseLink.href = '/src/styles/shared/base.css'
    baseLink.setAttribute('data-dynamic-css', 'base')
    document.head.appendChild(baseLink)
    
    // デバイス別スタイルを読み込み
    const isUsingMobileStyles = isMobile || isTouchDevice
    
    if (isUsingMobileStyles) {
      const mobileLink = document.createElement('link')
      mobileLink.rel = 'stylesheet'
      mobileLink.href = '/src/styles/mobile/mobile.css'
      mobileLink.setAttribute('data-dynamic-css', 'mobile')
      document.head.appendChild(mobileLink)
      
      console.log('モバイル向けCSSを読み込みました')
    } else {
      const desktopLink = document.createElement('link')
      desktopLink.rel = 'stylesheet'
      desktopLink.href = '/src/styles/desktop/desktop.css'
      desktopLink.setAttribute('data-dynamic-css', 'desktop')
      document.head.appendChild(desktopLink)
      
      console.log('デスクトップ向けCSSを読み込みました')
    }
    
    // クリーンアップ関数
    return () => {
      const dynamicStyles = document.querySelectorAll('link[data-dynamic-css]')
      dynamicStyles.forEach(style => style.remove())
    }
  }, [isMobile, isTouchDevice])
}