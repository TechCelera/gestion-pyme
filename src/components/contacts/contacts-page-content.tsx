'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2, UserCircle, Truck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { TableRowActions } from '@/components/ui/table-row-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getContacts, deleteContact, type ContactRow } from '@/lib/actions/contacts'
import {
  contactKindLabel,
  filterContactsForClients,
  filterContactsForProviders,
} from '@/lib/contacts/contact-filters'
import type { ContactKind } from '@/lib/validations/contact'
import { ContactForm } from '@/components/contacts/contact-form'

type ContactsPageContentProps = {
  kind: ContactKind
}

const PAGE_COPY: Record<
  ContactKind,
  { title: string; description: string; empty: string; icon: typeof UserCircle }
> = {
  client: {
    title: 'Clientes',
    description:
      'Quienes te compran o te deben. Creá, editá o corregí la ficha (nombre, teléfono, correo, CUIT). En cobros podés dar de alta uno rápido y completar datos después acá.',
    empty: 'Todavía no hay clientes. Creá el primero.',
    icon: UserCircle,
  },
  provider: {
    title: 'Proveedores',
    description:
      'A quienes les comprás o les debés. Creá, editá o corregí la ficha. En pagos podés dar de alta rápido y completar datos después acá.',
    empty: 'Todavía no hay proveedores. Creá el primero.',
    icon: Truck,
  },
}

export function ContactsPageContent({ kind }: ContactsPageContentProps) {
  const copy = PAGE_COPY[kind]
  const Icon = copy.icon

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ContactRow | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getContacts()
      if (res.success && res.data) {
        setContacts(res.data)
      } else {
        toast.error(res.error ?? 'Error al cargar')
      }
    } catch {
      toast.error('Error al cargar contactos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData()
    })
  }, [fetchData])

  const filtered =
    kind === 'client'
      ? filterContactsForClients(contacts)
      : filterContactsForProviders(contacts)

  const openForm = (row?: ContactRow) => {
    setEditing(row ?? null)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const handleDelete = async (row: ContactRow) => {
    const res = await deleteContact(row.id)
    if (res.success) {
      toast.success('Eliminado')
      void fetchData()
    } else {
      toast.error(res.error ?? 'No se pudo eliminar')
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title={copy.title} description={copy.description} />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            Listado
          </CardTitle>
          <Button onClick={() => openForm()} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{copy.empty}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openForm(row)}
                  >
                    <TableCell className="font-medium">
                      <span className="flex flex-wrap items-center gap-2">
                        {row.name}
                        {row.kind === 'both' ? (
                          <Badge variant="outline" className="text-xs">
                            {contactKindLabel(row.kind)}
                          </Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell>{row.phone ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.email ?? '—'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <TableRowActions
                        actions={[
                          {
                            key: 'edit',
                            label: 'Editar',
                            icon: Pencil,
                            onClick: () => openForm(row),
                          },
                          {
                            key: 'delete',
                            label: 'Eliminar',
                            icon: Trash2,
                            destructive: true,
                            onClick: () => void handleDelete(row),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ContactForm
        isOpen={formOpen}
        onClose={closeForm}
        onSaved={() => void fetchData()}
        kind={kind}
        contact={editing}
      />
    </div>
  )
}
