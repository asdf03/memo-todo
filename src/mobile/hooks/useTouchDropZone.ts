import { useCallback, useRef } from 'react'

export interface DropZone {
  id: string
  element: HTMLElement
  data?: any
}

export interface UseTouchDropZoneOptions {
  onDragEnter?: (dropZone: DropZone) => void
  onDragLeave?: (dropZone: DropZone) => void
  onDrop?: (dropZone: DropZone) => void
}

export const useTouchDropZone = (options: UseTouchDropZoneOptions = {}) => {
  const { onDragEnter, onDragLeave, onDrop } = options
  const dropZonesRef = useRef<Map<string, DropZone>>(new Map())
  const currentDropZoneRef = useRef<DropZone | null>(null)

  const registerDropZone = useCallback((element: HTMLElement, id: string, data?: any): (() => void) => {
    const dropZone: DropZone = { id, element, data }
    dropZonesRef.current.set(id, dropZone)
    
    return () => {
      dropZonesRef.current.delete(id)
    }
  }, [])

  const unregisterDropZone = useCallback((id: string) => {
    dropZonesRef.current.delete(id)
  }, [])

  const getDropZoneAtPoint = useCallback((x: number, y: number): DropZone | null => {
    const elements = document.elementsFromPoint(x, y)
    
    for (const [id, dropZone] of dropZonesRef.current.entries()) {
      if (elements.includes(dropZone.element)) {
        return dropZone
      }
    }
    
    return null
  }, [])

  const handleTouchMove = useCallback((position: { x: number; y: number }) => {
    const dropZone = getDropZoneAtPoint(position.x, position.y)
    
    if (dropZone !== currentDropZoneRef.current) {
      if (currentDropZoneRef.current && onDragLeave) {
        onDragLeave(currentDropZoneRef.current)
      }
      
      if (dropZone && onDragEnter) {
        onDragEnter(dropZone)
      }
      
      currentDropZoneRef.current = dropZone
    }
  }, [getDropZoneAtPoint, onDragEnter, onDragLeave])

  const handleTouchEnd = useCallback((position: { x: number; y: number }) => {
    const dropZone = getDropZoneAtPoint(position.x, position.y)
    
    if (dropZone && onDrop) {
      onDrop(dropZone)
    }
    
    if (currentDropZoneRef.current && onDragLeave) {
      onDragLeave(currentDropZoneRef.current)
    }
    
    currentDropZoneRef.current = null
  }, [getDropZoneAtPoint, onDrop, onDragLeave])

  return {
    registerDropZone,
    unregisterDropZone,
    handleTouchMove,
    handleTouchEnd
  }
}