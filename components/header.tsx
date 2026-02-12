'use client'

import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Shield, FileText, ClipboardList } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const { user, logout, isAdmin } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <FileText className="h-6 w-6 text-secondary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight">Fichas de Seguridad</h1>
            <p className="text-xs text-primary-foreground/70">Curtiduría Tungurahua</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                asChild
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/admin">
                  <Shield className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Administrar</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/audit">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Auditoría</span>
                </Link>
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
                <span className="hidden sm:inline">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name}</span>
                  <span className="text-xs font-normal text-muted-foreground capitalize">
                    {user?.role === 'admin' ? 'Administrador' : 'Operador'}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
