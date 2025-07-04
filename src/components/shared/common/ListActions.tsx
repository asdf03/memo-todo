import React from 'react'
import { useDeviceDetection } from '../../../hooks/useDeviceDetection'
import ListActionsMobile from '../../mobile/ListActionsMobile'
import ListActionsDesktop from '../../desktop/ListActionsDesktop'

interface ListActionsProps {
  listId: string
}

const ListActions: React.FC<ListActionsProps> = ({ listId }) => {
  const { isMobile, isTouchDevice } = useDeviceDetection()

  // デバッグ用ログ
  console.log('[ListActions] Device detection:', { isMobile, isTouchDevice })

  // モバイルまたはタッチデバイスの場合はモバイル版を使用
  if (isMobile || isTouchDevice) {
    return <ListActionsMobile listId={listId} />
  }

  // デスクトップ版を使用
  return <ListActionsDesktop listId={listId} />
}

export default ListActions