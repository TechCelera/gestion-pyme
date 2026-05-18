'use client'

import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Loader2, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  createCompanyInvite,
  listCompanyMembers,
  removeCompanyMember,
  sendMemberPasswordReset,
  updateCompanyMember,
  type CompanyMember,
} from '@/lib/actions/company-members'
import { getUserRoleLabel } from '@/lib/constants'
import { USER_ROLES } from '@/lib/auth/roles'
import { MAX_USERS_PER_COMPANY } from '@/lib/constants'

interface TeamSectionProps {
  currentUserId: string
}

export function TeamSection({ currentUserId }: TeamSectionProps) {
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    setIsLoading(true)
    const result = await listCompanyMembers()
    if (result.success && result.data) {
      setMembers(result.data)
    } else {
      toast.error(result.error ?? 'No se pudo cargar el equipo')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadMembers()
    })
  }, [loadMembers])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setIsInviting(true)
    try {
      const result = await createCompanyInvite(inviteEmail, inviteName)
      if (result.success && result.data) {
        toast.success('Invitación creada. Copiá el enlace y compartilo.')
        try {
          await navigator.clipboard.writeText(result.data.inviteUrl)
          toast.info('Enlace copiado al portapapeles')
        } catch {
          /* clipboard optional */
        }
        setInviteEmail('')
        setInviteName('')
        await loadMembers()
      } else {
        toast.error(result.error ?? 'No se pudo crear la invitación')
      }
    } finally {
      setIsInviting(false)
    }
  }

  async function handleRoleChange(memberId: string, role: string) {
    setUpdatingId(memberId)
    try {
      const result = await updateCompanyMember(memberId, {
        role: role as (typeof USER_ROLES)[keyof typeof USER_ROLES],
      })
      if (result.success) {
        toast.success('Rol actualizado')
        await loadMembers()
      } else {
        toast.error(result.error ?? 'Error al actualizar rol')
      }
    } finally {
      setUpdatingId(null)
    }
  }

  async function handlePasswordReset(member: CompanyMember) {
    setResettingId(member.id)
    try {
      const result = await sendMemberPasswordReset(member.id)
      if (result.success) {
        toast.success(`Enviamos un correo de recuperación a ${member.email}`)
      } else {
        toast.error(result.error ?? 'No se pudo enviar la recuperación')
      }
    } finally {
      setResettingId(null)
    }
  }

  async function handleRemove(member: CompanyMember) {
    const ok = window.confirm(
      `¿Eliminar a ${member.fullName}?\n\nPerderá el acceso a la empresa. Esta acción no se puede deshacer.`
    )
    if (!ok) return

    setRemovingId(member.id)
    try {
      const result = await removeCompanyMember(member.id)
      if (result.success) {
        toast.success('Usuario eliminado')
        await loadMembers()
      } else {
        toast.error(result.error ?? 'No se pudo eliminar el usuario')
      }
    } finally {
      setRemovingId(null)
    }
  }

  async function handleToggleActive(member: CompanyMember) {
    setUpdatingId(member.id)
    try {
      const result = await updateCompanyMember(member.id, { isActive: !member.isActive })
      if (result.success) {
        toast.success(member.isActive ? 'Usuario desactivado' : 'Usuario reactivado')
        await loadMembers()
      } else {
        toast.error(result.error ?? 'Error al actualizar estado')
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const activeCount = members.filter((m) => m.isActive).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear cuenta de colaborador</CardTitle>
          <CardDescription>
            Generá un enlace de registro (válido 7 días) para que se unan a tu empresa. Máximo{' '}
            {MAX_USERS_PER_COMPANY} usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleInvite}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor="inviteName">Nombre</Label>
              <Input
                id="inviteName"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Ej: María López"
                disabled={isInviting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Correo</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colaborador@empresa.com"
                disabled={isInviting}
                required
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isInviting || activeCount >= MAX_USERS_PER_COMPANY}
                className="w-full bg-[#7B68EE] hover:bg-[#7B68EE]/90 sm:w-auto"
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear enlace
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Personas en la empresa</CardTitle>
            <CardDescription>
              {activeCount} activo{activeCount === 1 ? '' : 's'} de {MAX_USERS_PER_COMPANY} permitidos
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadMembers()}>
            Actualizar
          </Button>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No hay usuarios en el equipo.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isSelf = member.id === currentUserId
                  const busy =
                    updatingId === member.id ||
                    resettingId === member.id ||
                    removingId === member.id
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.fullName}
                        {isSelf ? (
                          <span className="ml-2 text-xs text-muted-foreground">(vos)</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell>
                        {isSelf ? (
                          getUserRoleLabel(member.role)
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(v) => {
                              if (v) void handleRoleChange(member.id, v)
                            }}
                            disabled={busy}
                          >
                            <SelectTrigger className="h-8 w-[10.5rem]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={USER_ROLES.ADMIN}>Administrador</SelectItem>
                              <SelectItem value={USER_ROLES.COLLABORATOR}>Colaborador</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            member.isActive
                              ? 'text-green-700 text-xs font-medium'
                              : 'text-muted-foreground text-xs'
                          }
                        >
                          {member.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              disabled={busy}
                              onClick={() => void handlePasswordReset(member)}
                              title="Enviar correo para restablecer contraseña"
                            >
                              {resettingId === member.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <KeyRound className="mr-1 h-3.5 w-3.5" />
                                  Recuperar clave
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              disabled={busy}
                              onClick={() => void handleToggleActive(member)}
                            >
                              {member.isActive ? 'Desactivar' : 'Reactivar'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive"
                              disabled={busy}
                              onClick={() => void handleRemove(member)}
                            >
                              {removingId === member.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                                  Eliminar
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
