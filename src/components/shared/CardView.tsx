import React from 'react'
import { Card } from '../../types'
import CardViewMobile from '../mobile/CardViewMobile'
import CardViewDesktop from '../desktop/CardViewDesktop'
import { useDeviceDetection } from '../../hooks/useDeviceDetection'

interface CardViewProps {
  card: Card
  cardIndex: number
  listId: string
  onDelete: (cardId: string) => void
  onUpdate: (cardId: string, updatedCard: Partial<Card>) => void
  onDragStart: (e: React.DragEvent, card: Card, cardIndex: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetIndex: number) => void
  isDragOver?: boolean
}

const CardView: React.FC<CardViewProps> = (props) => {
  const deviceInfo = useDeviceDetection()
  
  // デバッグ用ログ
  console.log('[CardView] Device info:', deviceInfo)
  console.log('[CardView] Using component:', deviceInfo.isMobile ? 'Mobile' : 'Desktop')
  
  // モバイルまたはタブレットの場合はモバイル版を使用
  if (deviceInfo.isMobile || deviceInfo.isTablet) {
    return <CardViewMobile {...props} />
  }
  
  // デスクトップの場合はデスクトップ版を使用
  const { listId, ...desktopProps } = props
  return <CardViewDesktop {...desktopProps} />
}

export default CardView 