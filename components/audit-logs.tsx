'use client'

import React from "react"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ClipboardList,
  Search,
  Loader2,
  Eye,
  Upload,
  Download,
  Printer,
  Trash2,
  Edit,
  User,
  Clock,
  Monitor,
} from 'lucide-react'
import useSWR from 'swr'

interface AuditLog {
  AUDIT_ID: number
  AD_USER_ID: number
  ACTION: 'VIEW' | 'DOWNLOAD' | 'PRINT' | 'UPLOAD' | 'UPDATE' | 'DELETE' | 'LOGIN'
  TABLE_NAME: string
  RECORD_ID: number
  DESCRIPTION: string
  CREATED: string
  IP_ADDRESS?: string
  USER_NAME: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const actionConfig: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  LOGIN: {
    label: 'Inicio de sesion',
    icon: <User className="h-3 w-3" />,
    color: 'bg-slate-100 text-slate-800',
  },
  VIEW: {
    label: 'Visualización',
    icon: <Eye className="h-3 w-3" />,
    color: 'bg-blue-100 text-blue-800',
  },
  DOWNLOAD: {
    label: 'Descarga',
    icon: <Download className="h-3 w-3" />,
    color: 'bg-green-100 text-green-800',
  },
  PRINT: {
    label: 'Impresión',
    icon: <Printer className="h-3 w-3" />,
    color: 'bg-purple-100 text-purple-800',
  },
  UPLOAD: {
    label: 'Carga',
    icon: <Upload className="h-3 w-3" />,
    color: 'bg-amber-100 text-amber-800',
  },
  UPDATE: {
    label: 'Actualización',
    icon: <Edit className="h-3 w-3" />,
    color: 'bg-cyan-100 text-cyan-800',
  },
  DELETE: {
    label: 'Eliminación',
    icon: <Trash2 className="h-3 w-3" />,
    color: 'bg-red-100 text-red-800',
  },
}

export function AuditLogs() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')

  const { data, isLoading } = useSWR('/api/audit', fetcher)

  const logs: AuditLog[] = data?.logs || []

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.USER_NAME.toLowerCase().includes(search.toLowerCase()) ||
      log.DESCRIPTION.toLowerCase().includes(search.toLowerCase())
    const matchesAction = actionFilter === 'all' || log.ACTION === actionFilter
    return matchesSearch && matchesAction
  })

  function formatDateTime(dateString: string) {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Registros de Actividad
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-60"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filtrar por acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="LOGIN">Inicio de sesion</SelectItem>
                <SelectItem value="VIEW">Visualización</SelectItem>
                <SelectItem value="DOWNLOAD">Descarga</SelectItem>
                <SelectItem value="PRINT">Impresión</SelectItem>
                <SelectItem value="UPLOAD">Carga</SelectItem>
                <SelectItem value="UPDATE">Actualización</SelectItem>
                <SelectItem value="DELETE">Eliminación</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search || actionFilter !== 'all'
              ? 'No se encontraron registros con esos criterios'
              : 'No hay registros de auditoría'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead className="hidden lg:table-cell">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const { date, time } = formatDateTime(log.CREATED)
                  const config = actionConfig[log.ACTION] || {
                    label: log.ACTION,
                    icon: <Clock className="h-3 w-3" />,
                    color: 'bg-gray-100 text-gray-800',
                  }

                  return (
                    <TableRow key={log.AUDIT_ID}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 hidden sm:block" />
                          <div>
                            <div className="font-medium">{date}</div>
                            <div className="text-xs text-muted-foreground">{time}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{log.USER_NAME}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.color} hover:${config.color}`}>
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs">
                        <p className="truncate text-sm">{log.DESCRIPTION}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {log.IP_ADDRESS && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Monitor className="h-3 w-3" />
                            {log.IP_ADDRESS}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">
              Vistas: {logs.filter((l) => l.ACTION === 'VIEW').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">
              Descargas: {logs.filter((l) => l.ACTION === 'DOWNLOAD').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">
              Cargas: {logs.filter((l) => l.ACTION === 'UPLOAD').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">
              Eliminaciones: {logs.filter((l) => l.ACTION === 'DELETE').length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
