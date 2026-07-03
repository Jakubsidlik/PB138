import { useEffect, useState, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDashboard } from '../app/DashboardContext'
import { TIER_ORDER, TIER_COLORS, Tier, TierImage } from '../app/types'
import {
  ArrowLeft, Upload, Users, UserPlus, X, ChevronRight, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DndContext, DragEndEvent, useDraggable, useDroppable, DragOverlay, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { ExportTierListButton } from '../components/shared/tier/ExportTierListButton'

function DroppableTier({ tier, count, isExpanded, onToggle, images, onImageClick }: { tier: Tier; count: number; isExpanded: boolean; onToggle: () => void; images?: TierImage[]; onImageClick: (img: TierImage) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: tier })
  const colors = TIER_COLORS[tier]
  
  return (
    <div
      ref={setNodeRef}
      className={`tier-row transition-all ${isOver ? 'ring-4 ring-offset-2 scale-[1.02]' : ''}`}
      onClick={onToggle}
      id={`tier-row-${tier}`}
      style={isOver ? { borderColor: colors.border } as React.CSSProperties : { cursor: 'pointer' }}
    >
      <div
        className="tier-label"
        style={{ background: colors.gradient, color: colors.text }}
      >
        {tier}
      </div>
      <div className="tier-content p-2" style={{ pointerEvents: 'auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="flex justify-between items-center w-full min-h-[24px]">
          <span className="tier-count text-muted-foreground text-sm font-medium">{count} {count === 1 ? 'obrázek' : count < 5 && count > 0 ? 'obrázky' : 'obrázků'}</span>
          <ChevronRight className={`size-6 text-muted-foreground/50 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
        {isExpanded && (
          <div className="mt-2 pb-2 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            {images && images.length > 0 ? (
              images.map(img => (
                <DraggableTierImage key={img.id} img={img} onClick={() => onImageClick(img)} />
              ))
            ) : (
              <span className="text-muted-foreground text-sm">Načítání...</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DraggableTierImage({ img, onClick }: { img: TierImage; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: img.id.toString(),
    data: img,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`relative group w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0 cursor-pointer ${isDragging ? 'opacity-50 scale-105 shadow-md' : 'hover:ring-2 hover:ring-primary/50'}`}
      title={img.name}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {img.fileUrl ? (
        <img crossOrigin="anonymous" src={img.fileUrl} alt={img.name} className="w-full h-full object-cover pointer-events-none" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground pointer-events-none">
          {img.name.charAt(0)}
        </div>
      )}
    </div>
  )
}

function DroppableTrash() {
  const { setNodeRef, isOver } = useDroppable({ id: 'trash' })
  return (
    <div
      ref={setNodeRef}
      className={`mt-6 mb-8 mx-auto w-14 h-14 flex items-center justify-center rounded-full transition-all ${isOver ? 'bg-red-500/20 text-red-500 scale-110 ring-2 ring-red-500' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
      title="Přesunout sem pro odstranění"
    >
      <Trash2 className="size-6" />
    </div>
  )
}

function DraggableUnratedImage({ img, onClick }: { img: TierImage; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: img.id.toString(),
    data: img,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`unrated-thumb cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
      onClick={onClick}
      title={img.name}
    >
      {img.fileUrl ? (
        <img crossOrigin="anonymous" src={img.fileUrl} alt={img.name} draggable={false} className="pointer-events-none" />
      ) : (
        <div className="unrated-thumb-placeholder pointer-events-none">
          {img.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="unrated-thumb-name pointer-events-none">{img.name}</span>
    </div>
  )
}

export function TierListScreen({ groupId }: { groupId: number }) {
  const state = useDashboard()
  const navigate = useNavigate()
  const [membersOpen, setMembersOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ratingImage, setRatingImage] = useState<TierImage | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [removeMemberTarget, setRemoveMemberTarget] = useState<number | null>(null)
  const [expandedTiers, setExpandedTiers] = useState<Tier[]>([])
  const [selectedTierImage, setSelectedTierImage] = useState<TierImage | null>(null)
  
  useEffect(() => {
    state.loadGroupData(groupId)
    state.refreshTierCounts(groupId)
    state.refreshUnratedImages(groupId)
  }, [groupId])

  const handleUpload = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await state.uploadImage(groupId, e.target.files)
      e.target.value = ''
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    await state.inviteToGroup(groupId, inviteEmail.trim())
    setInviteEmail('')
    setInviteOpen(false)
  }

  const handleTierSelect = async (tier: Tier) => {
    if (!ratingImage) return
    await state.setImageTier(groupId, ratingImage.id, tier)
    setRatingImage(null)
    if (expandedTiers.includes(tier)) {
      state.refreshTierImages(groupId, tier)
    }
  }

  const handleRemoveMember = async () => {
    if (removeMemberTarget === null) return
    await state.removeGroupMember(groupId, removeMemberTarget)
    setRemoveMemberTarget(null)
  }

  const isOwner = state.activeGroup && state.authSession
    ? Number(state.authSession.userId) === state.activeGroup.ownerId
    : false

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const imageId = parseInt(active.id as string, 10)
    
    if (over.id === 'trash') {
      await state.deleteImage(groupId, imageId)
      if (expandedTiers.length > 0) {
        expandedTiers.forEach(t => state.refreshTierImages(groupId, t))
      }
      return
    }

    const tier = over.id as Tier
    if (!isNaN(imageId)) {
      await state.setImageTier(groupId, imageId, tier)
      if (expandedTiers.length > 0) {
        expandedTiers.forEach(t => state.refreshTierImages(groupId, t))
      }
    }
  }

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const activeDragImg = state.unratedImages.find((img: TierImage) => img.id.toString() === activeDragId) || Object.values(state.tierImages).flat().find((img: TierImage) => img.id.toString() === activeDragId)

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={(e) => setActiveDragId(e.active.id as string)}
      onDragEnd={(e) => {
        handleDragEnd(e)
        setActiveDragId(null)
      }}
      onDragCancel={() => setActiveDragId(null)}
    >
      <div className="tier-list-screen">
        {/* Header */}
        <div className="tier-header">
          <button className="tier-back-btn" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="size-5" />
          </button>
          <div className="tier-header-info">
            <h1 className="tier-header-title">{state.activeGroup?.name || 'Načítání...'}</h1>
            <span className="tier-header-meta">
              {state.activeGroup?.membersCount || 0} členů · {state.tierCounts.unrated} nehodnocených
            </span>
          </div>
          <div className="tier-header-actions">
            <ExportTierListButton 
              elementId="tier-list-container" 
              fileName={`${state.activeGroup?.name || 'group'}-tier-list.png`} 
            />
            <Button variant="outline" size="sm" onClick={() => navigate({ to: `/group/${groupId}/result` })} id="result-btn">
              Výsledek skupiny
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMembersOpen(true)} id="members-btn">
              <Users className="size-4" />
              <span className="hidden sm:inline">Členové</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)} id="invite-btn">
              <UserPlus className="size-4" />
              <span className="hidden sm:inline">Pozvat</span>
            </Button>
            <Button size="sm" onClick={handleUpload} id="upload-btn">
              <Upload className="size-4" />
              <span className="hidden sm:inline">Nahrát</span>
            </Button>
          </div>
        </div>

        {/* Tier List */}
        <div className="tier-list" id="tier-list-container">
          {TIER_ORDER.map((tier) => {
            const count = state.tierCounts[tier]
            const isExpanded = expandedTiers.includes(tier)
            return (
              <DroppableTier
                key={tier}
                tier={tier}
                count={count}
                isExpanded={isExpanded}
                images={isExpanded ? (state.tierImages[tier] || []) : undefined}
                onImageClick={(img) => setSelectedTierImage(img)}
                onToggle={() => {
                  if (isExpanded) {
                    setExpandedTiers(expandedTiers.filter(t => t !== tier))
                  } else {
                    setExpandedTiers([...expandedTiers, tier])
                    state.refreshTierImages(groupId, tier)
                  }
                }}
              />
            )
          })}
        </div>

        <DroppableTrash />

        {/* Unrated images bar */}
        {state.unratedImages.length > 0 && (
          <div className="unrated-section">
            <h3 className="unrated-title">
              Nehodnocené obrázky ({state.unratedImages.length})
            </h3>
            <div className="unrated-bar">
              {state.unratedImages.map((img) => (
                <DraggableUnratedImage
                  key={img.id}
                  img={img}
                  onClick={() => setRatingImage(img)}
                />
              ))}
            </div>
          </div>
        )}

        <DragOverlay dropAnimation={null}>
          {activeDragImg ? (
            <div className="unrated-thumb shadow-2xl opacity-80 cursor-grabbing rotate-3">
              {activeDragImg.fileUrl ? (
                <img src={activeDragImg.fileUrl} alt={activeDragImg.name} />
              ) : (
                <div className="unrated-thumb-placeholder">
                  {activeDragImg.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>

        {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Rating dialog */}
      <Dialog open={!!ratingImage} onOpenChange={() => setRatingImage(null)}>
        <DialogContent className="rating-dialog">
          <DialogHeader>
            <DialogTitle>Zařadit obrázek do tieru</DialogTitle>
            <DialogDescription>{ratingImage?.name}</DialogDescription>
          </DialogHeader>
          {ratingImage?.fileUrl && (
            <div className="rating-image-preview">
              <img src={ratingImage.fileUrl} alt={ratingImage.name} />
            </div>
          )}
          <div className="rating-tier-grid">
            {TIER_ORDER.map((tier) => {
              const colors = TIER_COLORS[tier]
              return (
                <button
                  key={tier}
                  className="rating-tier-btn"
                  style={{ background: colors.gradient, color: colors.text }}
                  onClick={() => handleTierSelect(tier)}
                >
                  {tier}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tier Image dialog */}
      <Dialog open={!!selectedTierImage} onOpenChange={(open) => !open && setSelectedTierImage(null)}>
        <DialogContent className="rating-dialog">
          <DialogHeader>
            <DialogTitle>Upravit zařazený obrázek</DialogTitle>
            <DialogDescription>{selectedTierImage?.name}</DialogDescription>
          </DialogHeader>
          {selectedTierImage?.fileUrl && (
            <div className="rating-image-preview">
              <img src={selectedTierImage.fileUrl} alt={selectedTierImage.name} />
            </div>
          )}
          <div className="rating-tier-grid mt-4">
            {TIER_ORDER.map((t) => {
              const colors = TIER_COLORS[t]
              return (
                <button
                  key={t}
                  className="rating-tier-btn"
                  style={{ background: colors.gradient, color: colors.text }}
                  onClick={async () => {
                    if (selectedTierImage) {
                      await state.setImageTier(groupId, selectedTierImage.id, t)
                      expandedTiers.forEach(expanded => state.refreshTierImages(groupId, expanded))
                      setSelectedTierImage(null)
                    }
                  }}
                >
                  {t}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="destructive" onClick={async () => {
              if (selectedTierImage) {
                await state.deleteImage(groupId, selectedTierImage.id)
                expandedTiers.forEach(expanded => state.refreshTierImages(groupId, expanded))
                setSelectedTierImage(null)
              }
            }}>
              <Trash2 className="size-4 mr-2" />
              Odstranit obrázek
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pozvat uživatele</DialogTitle>
            <DialogDescription>
              Zadejte e-mail uživatele, kterého chcete pozvat do skupiny.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="uzivatel@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Zrušit</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>Pozvat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Členové skupiny</DialogTitle>
          </DialogHeader>
          <div className="members-list">
            {state.groupMembers.map((member) => (
              <div key={member.id} className="member-item">
                <div className="member-info">
                  <span className="member-name">{member.user.fullName}</span>
                  <span className="member-email">{member.user.email}</span>
                  {member.role === 'OWNER' && (
                    <span className="member-badge owner">Vlastník</span>
                  )}
                </div>
                {isOwner && member.role !== 'OWNER' && (
                  <button
                    className="member-remove-btn"
                    onClick={() => setRemoveMemberTarget(member.userId)}
                    title="Odebrat člena"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove member confirmation */}
      <AlertDialog open={removeMemberTarget !== null} onOpenChange={() => setRemoveMemberTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odebrat člena?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete odebrat tohoto člena ze skupiny?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-red-600 hover:bg-red-700">
              Odebrat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </DndContext>
  )
}
