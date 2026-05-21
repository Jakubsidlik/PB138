import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Tag } from '../../../app/types'

type TagManagerModalProps = {
  tags: Tag[]
  onCreateTag: (data: { name: string, color: string }) => Promise<any>
  onDeleteTag: (id: number) => Promise<any>
}

export function TagManagerModal({ tags, onCreateTag, onDeleteTag }: TagManagerModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) return
    setIsSubmitting(true)
    try {
      await onCreateTag({ name: newTagName.trim(), color: '#888888' })
      setNewTagName('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    await onDeleteTag(id)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold shadow-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4">
          Správa štítků
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Správa štítků</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex flex-col gap-3 mb-6">
            <h3 className="text-sm font-medium text-muted-foreground">Existující štítky</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center gap-1 bg-muted/50 rounded-full pl-2 pr-1 py-1 border">
                  <Badge variant="outline" className="text-xs h-5 px-1.5 leading-none">
                    {tag.name}
                  </Badge>
                  {!tag.isSystem && (
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors text-muted-foreground"
                      title="Smazat štítek"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {tags.length === 0 && <span className="text-sm text-muted-foreground">Žádné štítky.</span>}
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">Vytvořit nový štítek</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Název</label>
                <Input
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="Např. Důležité"
                  maxLength={30}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!newTagName.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Vytvářím...' : 'Přidat štítek'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
