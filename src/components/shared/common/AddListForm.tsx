import React from 'react'
import { useDeviceDetection } from '../../../hooks/useDeviceDetection'
import AddListFormMobile from '../../mobile/AddListFormMobile'
import AddListFormDesktop from '../../desktop/AddListFormDesktop'

const AddListForm: React.FC = () => {
  const { isMobile, isTouchDevice } = useDeviceDetection()

  // デバッグ用（本番環境では削除）
  if (process.env.NODE_ENV === 'development') {
    console.log('AddListForm Device Detection:', { isMobile, isTouchDevice, selected: isMobile || isTouchDevice ? 'Mobile' : 'Desktop' })
  }

  if (isMobile || isTouchDevice) {
    return <AddListFormMobile />
  } else {
    return <AddListFormDesktop />
  }
}

export default AddListForm