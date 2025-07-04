import React, { useEffect } from 'react'
import { useDeviceDetection } from '../../hooks/useDeviceDetection'
import BoardViewMobile from '../mobile/BoardViewMobile'
import BoardViewDesktop from '../desktop/BoardViewDesktop'

const BoardView: React.FC = () => {
  const { isMobile, isTouchDevice } = useDeviceDetection()
  const isUsingMobileView = isMobile || isTouchDevice

  // プラットフォーム専用CSS動的読み込み
  useEffect(() => {
    const loadPlatformCSS = async () => {
      if (isUsingMobileView) {
        // モバイル専用スタイル読み込み
        await import('../mobile/styles/BoardViewMobile.css');
        await import('../mobile/styles/CardViewMobile.css');
        await import('../mobile/styles/ListActionsMobile.css');
      } else {
        // デスクトップ専用スタイル読み込み
        await import('../desktop/styles/BoardViewDesktop.css');
        await import('../desktop/styles/CardViewDesktop.css');
        await import('../desktop/styles/ListActionsDesktop.css');
      }
    };
    
    loadPlatformCSS();
  }, [isUsingMobileView]);

  // デバッグ用（本番環境では削除）
  if (process.env.NODE_ENV === 'development') {
    console.log('BoardView Device Detection:', { 
      isMobile, 
      isTouchDevice, 
      isUsingMobileView,
      selected: isUsingMobileView ? 'Mobile' : 'Desktop',
      css: isUsingMobileView ? 'Mobile CSS Loaded' : 'Desktop CSS Loaded'
    })
  }

  if (isUsingMobileView) {
    return <BoardViewMobile />
  } else {
    return <BoardViewDesktop />
  }
}

export default BoardView