'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import {
  FormSheet,
  FormSheetHeader,
  FormSheetBody,
  FormSheetActions,
} from '@/components/ui/form-sheet'
import { FormField, FormInput } from '@/components/ui/form-controls'
import { createContact, updateContact, type ContactRow } from '@/lib/actions/contacts'
import type { ContactKind } from '@/lib/validations/contact'

type ContactFormProps = {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  kind: ContactKind
  contact?: ContactRow | null
}

export function ContactForm({ isOpen, onClose, onSaved, kind, contact }: ContactFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [taxId, setTaxId] = useState('')
  const [notes, setNotes] = useState('')
  const [clientSegment, setClientSegment] = useState('')
  const [associatedServices, setAssociatedServices] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!contact
  const entityLabel = kind === 'client' ? 'cliente' : 'proveedor'

  const resetForm = useCallback(() => {
    setName('')
    setPhone('')
    setEmail('')
    setTaxId('')
    setNotes('')
    setClientSegment('')
    setAssociatedServices('')
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      if (contact) {
        setName(contact.name)
        setPhone(contact.phone ?? '')
        setEmail(contact.email ?? '')
        setTaxId(contact.taxId ?? '')
        setNotes(contact.notes ?? '')
        setClientSegment(contact.clientSegment ?? '')
        setAssociatedServices(contact.associatedServices ?? '')
      } else if (isOpen) {
        resetForm()
      }
    })
  }, [contact, isOpen, resetForm])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        taxId: taxId.trim() || null,
        notes: notes.trim() || null,
        clientSegment: kind === 'client' ? clientSegment.trim() || null : null,
        associatedServices:
          kind === 'client' ? associatedServices.trim() || null : null,
        ...(isEditing && contact?.kind === 'both'
          ? {}
          : { kind }),
      }

      const result =
        isEditing && contact
          ? await updateContact(contact.id, payload)
          : await createContact({ ...payload, kind })

      if (result.success) {
        toast.success(isEditing ? `${entityLabel} actualizado` : `${entityLabel} creado`)
        handleClose()
        onSaved()
      } else {
        toast.error(result.error ?? 'Error al guardar')
      }
    } catch {
      toast.error('Error inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <FormSheet open={isOpen} onClose={handleClose} maxWidth="md">
      <FormSheetHeader
        title={isEditing ? `Editar ${entityLabel}` : `Nuevo ${entityLabel}`}
        description="Nombre y teléfono son obligatorios. El resto ayuda para facturación y seguimiento."
      />

      <FormSheetBody>
          <FormField label="Nombre" htmlFor="contact-name" alignControl>
            <FormInput
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre o razón social"
              disabled={isSaving}
            />
          </FormField>

          <FormField label="Teléfono" htmlFor="contact-phone" alignControl>
            <FormInput
              id="contact-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: 11 5555-1234"
              disabled={isSaving}
              inputMode="tel"
            />
          </FormField>

          <FormField
            label={
              <>
                Correo{' '}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </>
            }
            htmlFor="contact-email"
            alignControl
          >
            <FormInput
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label={
              <>
                CUIT / ID fiscal{' '}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </>
            }
            htmlFor="contact-tax-id"
            alignControl
          >
            <FormInput
              id="contact-tax-id"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              disabled={isSaving}
            />
          </FormField>

          {kind === 'client' ? (
            <>
              <FormField
                label={
                  <>
                    Segmento{' '}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </>
                }
                htmlFor="contact-segment"
                alignControl
              >
                <FormInput
                  id="contact-segment"
                  value={clientSegment}
                  onChange={(e) => setClientSegment(e.target.value)}
                  placeholder="Ej: corporativo"
                  disabled={isSaving}
                />
              </FormField>
              <FormField
                label={
                  <>
                    Servicios{' '}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </>
                }
                htmlFor="contact-services"
                alignControl
              >
                <FormInput
                  id="contact-services"
                  value={associatedServices}
                  onChange={(e) => setAssociatedServices(e.target.value)}
                  disabled={isSaving}
                />
              </FormField>
            </>
          ) : null}

          <FormField
            label={
              <>
                Notas{' '}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </>
            }
            htmlFor="contact-notes"
            alignControl
          >
            <FormInput
              id="contact-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSaving}
            />
          </FormField>
      </FormSheetBody>

      <FormSheetActions
        onCancel={handleClose}
        onSubmit={() => void handleSubmit()}
        isSaving={isSaving}
        submitDisabled={!name.trim() || !phone.trim()}
        submitLabel={isEditing ? 'Guardar' : `Crear ${entityLabel}`}
      />
    </FormSheet>
  )
}
