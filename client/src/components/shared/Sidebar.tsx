import { Link, useRouterState } from '@tanstack/react-router'
import ghostLogo from '../../assets/ghostLogo.jpg'
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
  Calendar,
  CheckSquare,
  FolderOpen,
  BookOpen,
  Settings,
  LogOut,
} from 'lucide-react'

type AppSidebarProps = {
  onLogout: () => void
}

const navItems = [
  { to: '/', label: 'Hlavní stránka', icon: Home },
  { to: '/calendar', label: 'Kalendář', icon: Calendar },
  { to: '/tasks', label: 'Úkoly', icon: CheckSquare },
  { to: '/files', label: 'Soubory', icon: FolderOpen },
  { to: '/study', label: 'Studijní plán', icon: BookOpen },
] as const

function AppSidebar({ onLogout }: AppSidebarProps) {
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
                  <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                    <img
                      src={ghostLogo}
                      alt="Lonely Student Logo"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1 leading-none">
                    <span className="font-semibold text-base">Lonely Student</span>
                    <span className="text-sm text-muted-foreground">Study Planner</span>
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
              className="h-14 text-base [&_svg]:size-6 text-red-500 hover:bg-red-500 hover:text-background cursor-pointer"
            >
              <LogOut />
              <span>Odhlásit se</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </ShadcnSidebar>
  )
}

export { AppSidebar, SidebarProvider, SidebarInset, SidebarTrigger }