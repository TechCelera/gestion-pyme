'use client'

import { Button } from '@/components/ui/button'
import {
  FormField,
  FormInput,
  formButtonClass,
} from '@/components/ui/form-controls'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface MovementQuickContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  onNameChange: (value: string) => void
  phone: string
  onPhoneChange: (value: string) => void
  email: string
  onEmailChange: (value: string) => void
  contactKindLabel: 'cliente' | 'proveedor' | 'contacto'
  saving: boolean
  onSave: () => void
}

export function MovementQuickContactDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  phone,
  onPhoneChange,
  email,
  onEmailChange,
  contactKindLabel,
  saving,
  onSave,
}: MovementQuickContactDialogProps) {
  const canSave = Boolean(name.trim() && phone.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo {contactKindLabel}</DialogTitle>
          <DialogDescription>
            Nombre y teléfono para identificarlo en este movimiento. Podés completar más datos
            después en la ficha de {contactKindLabel}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <FormField label="Nombre" htmlFor="quick-contact-name" alignControl>
            <FormInput
              id="quick-contact-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Nombre o razón social"
              autoFocus
            />
          </FormField>
          <FormField label="Teléfono" htmlFor="quick-contact-phone" alignControl>
            <FormInput
              id="quick-contact-phone"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="Ej: 11 5555-1234"
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
            htmlFor="quick-contact-email"
            alignControl
          >
            <FormInput
              id="quick-contact-email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </FormField>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving || !canSave}
            className={formButtonClass}
          >
            {saving ? 'Guardando...' : `Crear ${contactKindLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
