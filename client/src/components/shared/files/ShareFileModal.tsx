import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'

type ShareFileModalProps = {
  isOpen: boolean
  onClose: () => void
  onShare: (email: string) => Promise<void>
  fileName: string
  fileUrl?: string
}

export function ShareFileModal({ isOpen, onClose, onShare, fileName, fileUrl }: ShareFileModalProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onShare(email)
      setEmail('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se nasdílet soubor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendViaEmailClient = () => {
    const subject = encodeURIComponent(`Sdílený soubor: ${fileName}`)
    const body = encodeURIComponent(
      `Ahoj,\n\nposílám ti odkaz na soubor "${fileName}" v aplikaci Planner.\n\nOdkaz: ${fileUrl || 'není k dispozici'}\n\nS pozdravem`
    )
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sdílet soubor</DialogTitle>
          <DialogDescription>
            Zadejte e-mailovou adresu uživatele, se kterým chcete sdílet soubor <strong>{fileName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="share-email">E-mail uživatele</Label>
            <Input
              id="share-email"
              type="email"
              placeholder="např. jan.novak@skola.cz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting || !email} className="w-full">
              {isSubmitting ? 'Sdílím a odesílám...' : 'Sdílet a odeslat e-mail'}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Uživateli bude v aplikaci nasdílen soubor a zároveň mu přijde e-mailové upozornění s odkazem.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
