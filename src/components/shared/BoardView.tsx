import React from 'react'
import { useDeviceDetection } from '../../hooks/shared/useDeviceDetection'
import BoardViewMobile from '../mobile/BoardViewMobile'
import BoardViewDesktop from '../desktop/BoardViewDesktop'

const BoardView: React.FC = () => {
  const { isMobile, isTouchDevice } = useDeviceDetection()
  const isUsingMobileView = isMobile || isTouchDevice

  if (isUsingMobileView) {
    return <BoardViewMobile />
  } else {
    return <BoardViewDesktop />
  }
}

export default BoardView