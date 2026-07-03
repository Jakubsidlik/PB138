import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDashboard } from '../app/DashboardContext'
import { Group } from '../app/types'
import { Users, Plus, Trash2, Crown, ImageIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function GroupsListScreen() {
  const state = useDashboard()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null)

  const handleCreate = async () => {
    if (!newGroupName.trim()) return
    await state.createGroup(newGroupName.trim())
    setNewGroupName('')
    setCreateOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await state.deleteGroup(deleteTarget.id)
    setDeleteTarget(null)
  }

  const isOwner = (group: Group) =>
    state.authSession && Number(state.authSession.userId) === group.ownerId

  return (
    <div className="groups-list-screen">
      <div className="groups-header">
        <div>
          <h1 className="groups-title">Moje skupiny</h1>
          <p className="groups-subtitle">Vyberte skupinu nebo vytvořte novou</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="mr-2 size-4" />
              Nová skupina
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vytvořit novou skupinu</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="group-name">Název skupiny</Label>
                <Input
                  id="group-name"
                  placeholder="např. Fotky z výletu"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Zrušit</Button>
              <Button onClick={handleCreate} disabled={!newGroupName.trim()}>Vytvořit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {state.groups.length === 0 ? (
        <div className="groups-empty">
          <div className="groups-empty-icon">
            <Users className="size-16" />
          </div>
          <h2>Zatím nemáte žádné skupiny</h2>
          <p>Vytvořte svou první skupinu a pozvěte přátele k hodnocení obrázků!</p>
          <Button className="create-group-btn" onClick={() => setCreateOpen(true)}>
            <Plus className="size-5" />
            <span>Vytvořit první skupinu</span>
          </Button>
        </div>
      ) : (
        <div className="groups-grid">
          {state.groups.map((group: Group) => (
            <div
              key={group.id}
              className="group-card"
              onClick={() => navigate({ to: `/group/${group.id}` })}
              id={`group-card-${group.id}`}
            >
              <div className="group-card-header">
                <div className="group-card-icon">
                  <ImageIcon className="size-6" />
                </div>
                <div className="group-card-actions">
                  {isOwner(group) && (
                    <button
                      className="group-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(group)
                      }}
                      title="Smazat skupinu"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="group-card-name">{group.name}</h3>

              <div className="group-card-meta">
                <div className="group-card-stat">
                  <Users className="size-4" />
                  <span>{group.membersCount} {group.membersCount === 1 ? 'člen' : group.membersCount < 5 ? 'členové' : 'členů'}</span>
                </div>
                {group.unratedCount > 0 && (
                  <div className="group-card-badge">
                    {group.unratedCount} nových
                  </div>
                )}
              </div>

              {isOwner(group) && (
                <div className="group-card-owner">
                  <Crown className="size-3" />
                  <span>Vlastník</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat skupinu?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat skupinu <strong>{deleteTarget?.name}</strong>? Tato akce je nevratná a smaže všechny obrázky ve skupině.
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
