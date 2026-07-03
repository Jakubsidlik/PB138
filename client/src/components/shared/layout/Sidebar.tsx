import { Link, useRouterState } from '@tanstack/react-router'
import { useDashboard } from '../../../app/DashboardContext'
import { useUser } from '@clerk/clerk-react'
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  AlertCircle,
  ImageIcon,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogMedia,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

type AppSidebarProps = {
  onLogout: () => void
}

const navItems = [
  { to: '/', label: 'Skupiny', icon: Home },
] as const

function AppSidebar({ onLogout }: AppSidebarProps) {
  const { authSession } = useDashboard()
  const { user } = useUser()
  const [showPermissionAlert, setShowPermissionAlert] = useState(false)
  const userEmail = user?.primaryEmailAddress?.emailAddress
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  const isActive = (to: string) => {
    if (to === '/') return pathname === '/'
    return pathname === to || pathname.startsWith(to + '/')
  }

  return (
    <ShadcnSidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-16"
              render={
                <Link to="/">
                  <img src="/logo.png" alt="Car-Y-list Logo" className="size-10 object-contain" />
                  <div className="flex flex-col gap-1 leading-none ml-2">
                    <span className="groups-title" style={{ fontSize: '1.6rem' }}>Car-Y-list</span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2 py-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton
                size="lg"
                isActive={isActive(item.to)}
                tooltip={item.label}
                render={<Link to={item.to} />}
                className="h-14 text-base [&_svg]:size-6"
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-2 py-2">
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              isActive={isActive('/admin')}
              tooltip="Admin"
              onClick={() => {
                if (authSession?.role === 'ADMIN' || userEmail?.toLowerCase() === 'admin.lonelystudent@proton.me') {
                  window.location.href = '/admin'
                } else {
                  setShowPermissionAlert(true)
                }
              }}
              className="h-14 text-base [&_svg]:size-6"
            >
              <Shield />
              <span>Admin</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              isActive={isActive('/profile')}
              tooltip="Nastavení"
              render={<Link to="/profile" />}
              className="h-14 text-base [&_svg]:size-6"
            >
              <Settings />
              <span>Nastavení</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={onLogout}
              tooltip="Odhlásit se"
              className="h-14 text-base [&_svg]:size-6 text-red-500 hover:bg-red-500 hover:text-white hover:font-bold cursor-pointer"
            >
              <LogOut />
              <span>Odhlásit se</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <AlertDialog open={showPermissionAlert} onOpenChange={setShowPermissionAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Přístup odepřen</AlertDialogTitle>
            <AlertDialogDescription>
              K této akci nemáte dostatečná oprávnění. 
              <br /><br />
              <span className="text-xs text-muted-foreground">
                Email: {userEmail || 'Neznámý'}
                <br />
                Role: {authSession?.role || 'Nedefinováno'}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowPermissionAlert(false)}>
              Rozumím
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ShadcnSidebar>
  )
}

export { AppSidebar, SidebarProvider, SidebarInset, SidebarTrigger }
