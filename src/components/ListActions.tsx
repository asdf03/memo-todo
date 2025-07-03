import React, { memo, useCallback } from 'react'
import { useBoardOperations } from '../hooks/useBoardOperations'

interface ListActionsProps {
  listId: string
}

const ListActions: React.FC<ListActionsProps> = memo(({ listId }) => {
  const { addCard } = useBoardOperations()

  const handleAddCard = useCallback(async () => {
    const cardTitle = prompt('新しいカードのタイトルを入力してください:')
    if (cardTitle && cardTitle.trim()) {
      await addCard(listId, cardTitle.trim())
    }
  }, [listId, addCard])

  return (
    <button className="add-card-btn" onClick={handleAddCard}>
      + カードを追加
    </button>
  )
})

export default ListActions