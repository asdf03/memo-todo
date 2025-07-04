import React, { memo } from 'react'
import { List } from '../../types'
import { useDeviceDetection } from '../../hooks/useDeviceDetection'
import ListHeaderDesktop from '../desktop/ListHeaderDesktop'
import ListHeaderMobile from '../mobile/ListHeaderMobile'

interface ListHeaderProps {
  list: List
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
}

const ListHeader: React.FC<ListHeaderProps> = memo(({ list, onListDragStart, onListDragEnd }) => {
  const { isMobile, isTouchDevice } = useDeviceDetection()
  
  // デバッグ情報
  const debugMode = true // 開発時のみtrueに設定
  
  if (debugMode) {
    console.log(`[ListHeader] Device detection:`, { 
      isMobile, 
      isTouchDevice, 
      listTitle: list.title,
      selectedComponent: (isMobile || isTouchDevice) ? 'Mobile' : 'Desktop'
    })
  }
  
  // モバイルまたはタッチデバイスの場合はMobileコンポーネントを使用
  if (isMobile || isTouchDevice) {
    return (
      <ListHeaderMobile
        list={list}
        onListDragStart={onListDragStart}
        onListDragEnd={onListDragEnd}
      />
    )
  }
  
  // デスクトップの場合はDesktopコンポーネントを使用
  return (
    <ListHeaderDesktop
      list={list}
      onListDragStart={onListDragStart}
      onListDragEnd={onListDragEnd}
    />
  )
})

export default ListHeader