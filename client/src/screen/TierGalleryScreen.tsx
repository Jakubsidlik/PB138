import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDashboard } from '../app/DashboardContext'
import { TIER_COLORS, TIER_ORDER, Tier, TierImage } from '../app/types'
import { ArrowLeft, Trash2, Shuffle } from 'lucide-react'
import { ImageComments } from '../components/shared/comments/ImageComments'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function TierGalleryScreen({ groupId, tier }: { groupId: number; tier: Tier }) {
  const state = useDashboard()
  const navigate = useNavigate()
  const [lightboxImage, setLightboxImage] = useState<TierImage | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TierImage | null>(null)
  const [changeTierImage, setChangeTierImage] = useState<TierImage | null>(null)

  useEffect(() => {
    state.setActiveTier(tier)
    state.refreshTierImages(groupId, tier)
  }, [groupId, tier])

  const colors = TIER_COLORS[tier]

  const handleDelete = async () => {
    if (!deleteTarget) return
    await state.deleteImage(groupId, deleteTarget.id)
    setDeleteTarget(null)
    setLightboxImage(null)
  }

  const handleChangeTier = async (newTier: Tier) => {
    if (!changeTierImage) return
    await state.setImageTier(groupId, changeTierImage.id, newTier)
    setChangeTierImage(null)
    setLightboxImage(null)
    // Refresh current tier
    await state.refreshTierImages(groupId, tier)
  }

  return (
    <div className="tier-gallery-screen">
      {/* Header */}
      <div className="gallery-header" style={{ borderColor: colors.border }}>
        <button className="tier-back-btn" onClick={() => navigate({ to: `/group/${groupId}` })}>
          <ArrowLeft className="size-5" />
        </button>
        <div
          className="gallery-tier-badge"
          style={{ background: colors.gradient, color: colors.text }}
        >
          {tier}
        </div>
        <div className="gallery-header-info">
          <h1 className="gallery-title">Tier {tier}</h1>
          <span className="gallery-subtitle">
            {state.tierImages.length} {state.tierImages.length === 1 ? 'obrázek' : state.tierImages.length < 5 ? 'obrázky' : 'obrázků'}
          </span>
        </div>
      </div>

      {/* Gallery grid */}
      {state.tierImages.length === 0 ? (
        <div className="gallery-empty">
          <p>V této kategorii zatím nejsou žádné obrázky.</p>
          <Button variant="outline" onClick={() => navigate({ to: `/group/${groupId}` })}>
            Zpět na tier list
          </Button>
        </div>
      ) : (
        <div className="gallery-grid">
          {state.tierImages.map((img) => (
            <div
              key={img.id}
              className="gallery-card"
              onClick={() => setLightboxImage(img)}
            >
              <div className="gallery-card-image">
                {img.fileUrl ? (
                  <img src={img.fileUrl} alt={img.name} loading="lazy" />
                ) : (
                  <div className="gallery-card-placeholder">
                    {img.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="gallery-card-info">
                <span className="gallery-card-name" title={img.name}>{img.name}</span>
                <span className="gallery-card-meta">
                  {img.uploadedBy.fullName}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="lightbox-dialog">
          <DialogHeader>
            <DialogTitle>{lightboxImage?.name}</DialogTitle>
          </DialogHeader>
          {lightboxImage?.fileUrl && (
            <div className="lightbox-image">
              <img src={lightboxImage.fileUrl} alt={lightboxImage.name} />
            </div>
          )}
          <div className="lightbox-info">
            <p><strong>Nahrál:</strong> {lightboxImage?.uploadedBy.fullName}</p>
            {lightboxImage?.ratedBy && (
              <p><strong>Zařadil:</strong> {(lightboxImage.ratedBy as any).fullName || 'Neznámý'}</p>
            )}
          </div>
          <div className="lightbox-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => lightboxImage && setChangeTierImage(lightboxImage)}
            >
              <Shuffle className="size-4" />
              Změnit tier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => lightboxImage && setDeleteTarget(lightboxImage)}
            >
              <Trash2 className="size-4" />
              Smazat
            </Button>
          </div>
          {lightboxImage && (
            <ImageComments groupId={groupId} imageId={lightboxImage.id} />
          )}
        </DialogContent>
      </Dialog>

      {/* Change tier dialog */}
      <Dialog open={!!changeTierImage} onOpenChange={(o) => !o && setChangeTierImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Změnit tier</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {TIER_ORDER.map((t: Tier) => (
              <Button
                key={t}
                variant={t === tier ? 'default' : 'outline'}
                onClick={() => handleChangeTier(t)}
                disabled={t === tier}
                style={t === tier ? { backgroundColor: TIER_COLORS[t].gradient.split(',')[0].replace('linear-gradient(135deg, ', '') } : {}}
              >
                Přesunout do {t}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat obrázek?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat obrázek <strong>{deleteTarget?.name}</strong>? Tato akce je nevratná.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
