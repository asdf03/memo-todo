import { useCallback } from 'react'

export const useOptimisticUpdate = () => {
  const optimisticUpdate = useCallback(
    async (
      optimisticFn: () => void,
      actualFn: () => Promise<void>,
      rollbackFn: () => void
    ) => {
      try {
        optimisticFn()
        await actualFn()
      } catch (error) {
        console.error('Operation failed, rolling back:', error)
        rollbackFn()
      }
    },
    []
  )

  return { optimisticUpdate }
}

export default useOptimisticUpdate