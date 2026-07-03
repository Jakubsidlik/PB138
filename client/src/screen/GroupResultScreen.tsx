import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDashboard } from '../app/DashboardContext'
import { TIER_ORDER, TIER_COLORS, Tier, GroupResultImage, ImageRating } from '../app/types'
import { ArrowLeft, Users, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportTierListButton } from '../components/shared/tier/ExportTierListButton'

export function GroupResultScreen({ groupId }: { groupId: number }) {
  const state = useDashboard()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'group' | 'personal'>('group')

  useEffect(() => {
    state.loadGroupData(groupId)
    state.refreshGroupResult(groupId)
    state.refreshMyRatings(groupId)
  }, [groupId])

  const groupResultImages = state.groupResult?.images || []
  const myRatingsMap = new Map(state.myRatings.map((r: ImageRating) => [r.imageId, r.tier]))

  const getTierImages = (tier: Tier) => {
    if (viewMode === 'group') {
      return groupResultImages.filter((img: GroupResultImage) => img.resultTier === tier)
    } else {
      // Personal mode: show where I placed them
      return groupResultImages.filter((img: GroupResultImage) => myRatingsMap.get(img.image.id) === tier)
    }
  }

  const getUnratedImages = () => {
    if (viewMode === 'group') {
      return groupResultImages.filter((img: GroupResultImage) => !img.resultTier)
    } else {
      return groupResultImages.filter((img: GroupResultImage) => !myRatingsMap.has(img.image.id))
    }
  }

  return (
    <div className="tier-list-screen pb-20">
      {/* Header */}
      <div className="tier-header">
        <button className="tier-back-btn" onClick={() => navigate({ to: `/group/${groupId}` })}>
          <ArrowLeft className="size-5" />
        </button>
        <div className="tier-header-info">
          <h1 className="tier-header-title">{state.activeGroup?.name || 'Skupinový výsledek'}</h1>
          <span className="tier-header-meta">Souhrn hodnocení členů</span>
        </div>
        <div className="flex gap-2">
          <ExportTierListButton 
            elementId="tier-list-export-container" 
            fileName={`${state.activeGroup?.name || 'group'}-tier-list.png`} 
          />
          <div className="flex gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'group' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('group')}
              className="flex gap-2"
            >
              <Users className="size-4" />
              <span className="hidden sm:inline">Skupina</span>
            </Button>
            <Button
              variant={viewMode === 'personal' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('personal')}
              className="flex gap-2"
            >
              <User className="size-4" />
              <span className="hidden sm:inline">Moje hodnocení</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:px-8 text-sm text-muted-foreground">
        {viewMode === 'group' 
          ? 'Zde vidíš nejčastější hodnocení pro každý obrázek od všech členů skupiny.' 
          : 'Zde vidíš, jak jsi obrázky ohodnotil ty osobně.'}
      </div>

      <div id="tier-list-export-container" className="p-4 bg-[var(--background)]">
        {/* Tier List */}
        <div className="tier-list">
          {TIER_ORDER.map((tier) => {
          const colors = TIER_COLORS[tier]
          const tierImages = getTierImages(tier)
          
          return (
            <div key={tier} className="tier-row" style={{ cursor: 'default' }}>
              <div
                className="tier-label"
                style={{ background: colors.gradient, color: colors.text }}
              >
                {tier}
              </div>
              <div className="tier-content p-2">
                {tierImages.length === 0 ? (
                  <span className="text-muted-foreground text-sm pl-2">Žádné obrázky</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tierImages.map(result => (
                      <div key={result.image.id} className="relative group w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {result.image.fileUrl ? (
                          <img crossOrigin="anonymous" src={result.image.fileUrl} alt={result.image.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                            {result.image.name.charAt(0)}
                          </div>
                        )}
                        
                        {/* Tooltip pro hlasy */}
                        {viewMode === 'group' && result.votes.length > 0 && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
                            <span className="text-white text-[10px] font-bold">Hlasy:</span>
                            <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                              {result.votes.map(v => (
                                <div 
                                  key={v.userId} 
                                  title={`${v.user.fullName} (${v.tier})`}
                                  className="w-3 h-3 rounded-full border border-white text-[7px] flex items-center justify-center"
                                  style={{ background: TIER_COLORS[v.tier].gradient, color: TIER_COLORS[v.tier].text }}
                                >
                                  {v.tier}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Unrated images */}
      {getUnratedImages().length > 0 && (
        <div className="unrated-section mt-8">
          <h3 className="unrated-title">
            Nezařazeno ({getUnratedImages().length})
          </h3>
          <div className="unrated-bar">
            {getUnratedImages().map(result => (
              <div key={result.image.id} className="unrated-thumb w-16 h-16" title={result.image.name}>
                {result.image.fileUrl ? (
                  <img crossOrigin="anonymous" src={result.image.fileUrl} alt={result.image.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="unrated-thumb-placeholder w-full h-full">
                    {result.image.name.charAt(0)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
