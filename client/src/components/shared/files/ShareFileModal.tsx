import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { useDashboard } from '../../../app/DashboardContext'
import { toast } from 'sonner'

type ShareFileModalProps = {
  isOpen: boolean
  onClose: () => void
  onShare: (email: string) => Promise<void>
  fileName: string
  fileUrl?: string
}

export function ShareFileModal({ isOpen, onClose, onShare, fileName }: ShareFileModalProps) {
  const { apiFetch } = useDashboard()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInviteOption, setShowInviteOption] = useState(false)

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
      if (err.message?.toLowerCase().includes('nebyl nalezen')) {
        setShowInviteOption(true)
      } else {
        setError(err.message || 'Nepodařilo se nasdílet soubor.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendInvite = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await apiFetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          itemName: fileName,
          itemType: 'file'
        })
      })
      if (res.ok) {
        toast.success('Pozvánka k registraci byla úspěšně odeslána.')
        setEmail('')
        onClose()
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Nepodařilo se odeslat pozvánku.')
      }
    } catch (e: any) {
      setError(e.message || 'Nepodařilo se odeslat pozvánku.')
    } finally {
      setIsSubmitting(false)
      setShowInviteOption(false)
    }
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

        {showInviteOption ? (
          <div className="space-y-4 py-4 animate-in fade-in duration-300">
            <div className="border border-blue-500/30 rounded-xl p-4 bg-blue-500/5 text-center">
              <p className="text-sm font-medium">Uživatel s e-mailem <strong>{email}</strong> není v databázi.</p>
              <p className="text-xs text-muted-foreground mt-1">Chcete mu poslat e-mail s pozvánkou k registraci?</p>
            </div>
            
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowInviteOption(false)} disabled={isSubmitting}>Zrušit</Button>
              <Button type="button" className="flex-1" onClick={handleSendInvite} disabled={isSubmitting}>
                {isSubmitting ? 'Odesílám...' : 'Poslat pozvánku'}
              </Button>
            </div>
          </div>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  )
}
