import React, { useEffect } from 'react'
import { useDeviceDetection } from '../../hooks/useDeviceDetection'
import BoardViewMobile from '../mobile/BoardViewMobile'
import BoardViewDesktop from '../desktop/BoardViewDesktop'

const BoardView: React.FC = () => {
  const { isMobile, isTouchDevice } = useDeviceDetection()
  const isUsingMobileView = isMobile || isTouchDevice

  // プラットフォーム専用CSS動的読み込み
  useEffect(() => {
    if (isUsingMobileView) {
      // モバイル専用スタイル読み込み
      require('../mobile/styles/BoardViewMobile.css');
      require('../mobile/styles/CardViewMobile.css');
      require('../mobile/styles/ListActionsMobile.css');
    } else {
      // デスクトップ専用スタイル読み込み
      require('../desktop/styles/BoardViewDesktop.css');
      require('../desktop/styles/CardViewDesktop.css');
      require('../desktop/styles/ListActionsDesktop.css');
    }
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