import React, { memo, useEffect } from 'react'

interface MobileOverlayProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const MobileOverlay: React.FC<MobileOverlayProps> = memo(({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      // スクロールを無効化
      document.body.style.overflow = 'hidden'
      
      // Escapeキーでクローズ
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="mobile-overlay" onClick={onClose}>
      <div className="mobile-overlay-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
})

export default MobileOverlay