import React from 'react'
import { useDeviceDetection } from '../../hooks/useDeviceDetection'
import BoardViewMobile from '../mobile/BoardViewMobile'
import BoardViewDesktop from '../desktop/BoardViewDesktop'

const BoardView: React.FC = () => {
  const { isMobile, isTouchDevice } = useDeviceDetection()
  const isUsingMobileView = isMobile || isTouchDevice


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