import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { CategoryManagementModal } from '@/features/categories'

export default function CategoriesPage() {
  const navigate = useNavigate()

  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/dashboard')
    }
  }, [navigate])

  return <CategoryManagementModal isOpen={true} onClose={handleClose} />
}
