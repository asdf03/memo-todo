import React from 'react'
import { useDeviceDetection } from '../../hooks/useDeviceDetection'
import BoardViewMobile from '../mobile/BoardViewMobile'
import BoardViewDesktop from '../desktop/BoardViewDesktop'

const BoardView: React.FC = () => {
  const { isMobile, isTouchDevice } = useDeviceDetection()

  // デバッグ用（本番環境では削除）
  if (process.env.NODE_ENV === 'development') {
    console.log('BoardView Device Detection:', { isMobile, isTouchDevice, selected: isMobile || isTouchDevice ? 'Mobile' : 'Desktop' })
  }

  if (isMobile || isTouchDevice) {
    return <BoardViewMobile />
  } else {
    return <BoardViewDesktop />
  }
}

export default BoardView