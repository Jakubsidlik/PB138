import React, { useEffect, useState } from 'react'
import { useDashboard } from '../../../app/DashboardContext'
import { ImageComment } from '../../../app/types'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Trash2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface ImageCommentsProps {
  groupId: number
  imageId: number
}

export function ImageComments({ groupId, imageId }: ImageCommentsProps) {
  const state = useDashboard()
  const [comments, setComments] = useState<ImageComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = async () => {
    try {
      setLoading(true)
      const res = await state.apiFetch(`/api/groups/${groupId}/images/${imageId}/comments`)
      if (res.ok) {
        setComments(await res.json())
      }
    } catch (e) {
      console.error('Failed to load comments', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [groupId, imageId])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    try {
      setSubmitting(true)
      const res = await state.apiFetch(`/api/groups/${groupId}/images/${imageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        setNewComment('')
        await fetchComments()
      } else {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || 'Nepodařilo se přidat komentář.')
      }
    } catch (e) {
      toast.error('Chyba při přidávání komentáře.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Opravdu smazat komentář?')) return
    try {
      const res = await state.apiFetch(`/api/groups/${groupId}/images/${imageId}/comments/${commentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchComments()
      } else {
        toast.error('Nepodařilo se smazat komentář.')
      }
    } catch (e) {
      toast.error('Chyba při mazání komentáře.')
    }
  }

  const currentUserId = state.authSession?.userId

  return (
    <div className="flex flex-col gap-4 mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="size-5" />
        Komentáře ({comments.length})
      </h3>

      <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Načítání komentářů...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Zatím žádné komentáře. Buďte první!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex flex-col gap-1 bg-muted/30 p-3 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[var(--accent)]">{c.userFullName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString('cs-CZ')}
                  </span>
                  {(currentUserId === c.userId || state.activeGroup?.ownerId === currentUserId) && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                      title="Smazat komentář"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-foreground break-words">{c.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddComment} className="flex gap-2 mt-2">
        <Input
          placeholder="Napište komentář..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
          maxLength={500}
        />
        <Button type="submit" disabled={!newComment.trim() || submitting}>
          Odeslat
        </Button>
      </form>
    </div>
  )
}
