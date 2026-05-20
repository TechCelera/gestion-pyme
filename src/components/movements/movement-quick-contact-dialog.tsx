'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  contactKindLabel: 'cliente' | 'proveedor' | 'contacto'
  saving: boolean
  onSave: () => void
}

export function MovementQuickContactDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  contactKindLabel,
  saving,
  onSave,
}: MovementQuickContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo {contactKindLabel}</DialogTitle>
          <DialogDescription>
            Solo necesitamos el nombre. Queda guardado en tu empresa y seleccionado en este movimiento.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <div className="space-y-1">
            <Label htmlFor="quick-contact-name">Nombre</Label>
            <Input
              id="quick-contact-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Nombre o razón social"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving || !name.trim()}
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90"
          >
            {saving ? 'Guardando...' : `Crear ${contactKindLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
