'use client'

/**
 * Delete Button Component
 *
 * Client component for deleting items with confirmation.
 * Works for both users and posts by specifying the API endpoint.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteButtonProps {
  id: string | number
  name: string
  endpoint: 'users' | 'posts'
  onDelete?: () => void
}

export function DeleteButton({ id, name, endpoint, onDelete }: DeleteButtonProps) {
  const router = useRouter()
  const [confirmId, setConfirmId] = useState<string | number | null>(null)

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      router.refresh()
      onDelete?.()
    } catch (err) {
      console.error('Delete failed:', err)
    }
    setConfirmId(null)
  }

  if (confirmId === id) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600 dark:text-red-400">Delete?</span>
        <button
          onClick={handleDelete}
          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirmId(null)}
          className="rounded bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-500"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmId(id)}
      className="rounded px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-700 dark:hover:text-red-400"
      title={`Delete ${name}`}
    >
      Delete
    </button>
  )
}
