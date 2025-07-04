// ドロップ位置を検出するユーティリティ関数

export interface DropTarget {
  element: HTMLElement
  type: 'list' | 'card'
  id: string
  index: number
  rect: DOMRect
}

// 指定した座標の下にあるドロップ可能な要素を見つける
export const findDropTarget = (x: number, y: number): DropTarget | null => {
  const element = document.elementFromPoint(x, y) as HTMLElement
  if (!element) return null

  // カードまたはリストの要素を探す
  let target = element
  while (target && target !== document.body) {
    // カードの場合
    if (target.classList.contains('card-view')) {
      const cardElement = target.closest('[data-card-id]') as HTMLElement
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id')
        const cardIndex = parseInt(cardElement.getAttribute('data-card-index') || '0')
        if (cardId) {
          return {
            element: cardElement,
            type: 'card',
            id: cardId,
            index: cardIndex,
            rect: cardElement.getBoundingClientRect()
          }
        }
      }
    }

    // リストの場合
    if (target.classList.contains('list-view')) {
      const listElement = target.closest('[data-list-id]') as HTMLElement
      if (listElement) {
        const listId = listElement.getAttribute('data-list-id')
        const listIndex = parseInt(listElement.getAttribute('data-list-index') || '0')
        if (listId) {
          return {
            element: listElement,
            type: 'list',
            id: listId,
            index: listIndex,
            rect: listElement.getBoundingClientRect()
          }
        }
      }
    }

    // カードコンテナの場合（空のリストへのドロップ）
    if (target.classList.contains('cards-container')) {
      const listElement = target.closest('[data-list-id]') as HTMLElement
      if (listElement) {
        const listId = listElement.getAttribute('data-list-id')
        if (listId) {
          return {
            element: listElement,
            type: 'list',
            id: listId,
            index: 0, // 空のリストの場合は最初の位置
            rect: target.getBoundingClientRect()
          }
        }
      }
    }

    target = target.parentElement as HTMLElement
  }

  return null
}

// ドロップ位置の挿入インデックスを計算
export const calculateDropIndex = (
  dropY: number,
  containerRect: DOMRect,
  itemHeight: number,
  itemCount: number
): number => {
  const relativeY = dropY - containerRect.top
  const index = Math.floor(relativeY / itemHeight)
  return Math.max(0, Math.min(index, itemCount))
}

// 2つの要素の位置を交換するかどうかを判定
export const shouldSwapElements = (
  targetRect: DOMRect,
  dropX: number,
  dropY: number
): boolean => {
  const targetCenterX = targetRect.left + targetRect.width / 2
  const targetCenterY = targetRect.top + targetRect.height / 2

  // ドロップ位置がターゲット要素の中心を越えた場合は交換
  const horizontalThreshold = targetRect.width * 0.3
  const verticalThreshold = targetRect.height * 0.3

  return (
    Math.abs(dropX - targetCenterX) < horizontalThreshold &&
    Math.abs(dropY - targetCenterY) < verticalThreshold
  )
}