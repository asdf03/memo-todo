import { useCallback, useRef } from 'react'

export interface DropZoneElement {
  element: HTMLElement
  id: string
  data?: any
}

export interface UseTouchDropZoneOptions {
  onDragEnter?: (dropZone: DropZoneElement, touch: { x: number; y: number }) => void
  onDragLeave?: (dropZone: DropZoneElement) => void
  onDrop?: (dropZone: DropZoneElement, touch: { x: number; y: number }) => void
}

export const useTouchDropZone = (options: UseTouchDropZoneOptions = {}) => {
  const { onDragEnter, onDragLeave, onDrop } = options
  const dropZonesRef = useRef<DropZoneElement[]>([])
  const currentDropZoneRef = useRef<DropZoneElement | null>(null)

  const registerDropZone = useCallback((element: HTMLElement, id: string, data?: any) => {
    const dropZone: DropZoneElement = { element, id, data }
    dropZonesRef.current = [...dropZonesRef.current.filter(dz => dz.id !== id), dropZone]
    
    return () => {
      dropZonesRef.current = dropZonesRef.current.filter(dz => dz.id !== id)
    }
  }, [])

  const findDropZoneAtPosition = useCallback((x: number, y: number): DropZoneElement | null => {
    // Get element at touch position
    const elementAtPosition = document.elementFromPoint(x, y)
    if (!elementAtPosition) return null

    // Check if touch is over any registered drop zone
    for (const dropZone of dropZonesRef.current) {
      if (dropZone.element.contains(elementAtPosition) || dropZone.element === elementAtPosition) {
        return dropZone
      }
    }

    return null
  }, [])

  const handleTouchMove = useCallback((touch: { x: number; y: number }) => {
    const dropZone = findDropZoneAtPosition(touch.x, touch.y)
    
    // Handle enter/leave events
    if (dropZone !== currentDropZoneRef.current) {
      // Leave previous drop zone
      if (currentDropZoneRef.current && onDragLeave) {
        onDragLeave(currentDropZoneRef.current)
      }
      
      // Enter new drop zone
      if (dropZone && onDragEnter) {
        onDragEnter(dropZone, touch)
      }
      
      currentDropZoneRef.current = dropZone
    }
  }, [findDropZoneAtPosition, onDragEnter, onDragLeave])

  const handleTouchEnd = useCallback((touch: { x: number; y: number }) => {
    const dropZone = findDropZoneAtPosition(touch.x, touch.y)
    
    if (dropZone && onDrop) {
      onDrop(dropZone, touch)
    }

    // Leave current drop zone
    if (currentDropZoneRef.current && onDragLeave) {
      onDragLeave(currentDropZoneRef.current)
    }
    
    currentDropZoneRef.current = null
  }, [findDropZoneAtPosition, onDrop, onDragLeave])

  const clearDropZones = useCallback(() => {
    dropZonesRef.current = []
    currentDropZoneRef.current = null
  }, [])

  return {
    registerDropZone,
    handleTouchMove,
    handleTouchEnd,
    clearDropZones,
    currentDropZone: currentDropZoneRef.current
  }
}

export default useTouchDropZone