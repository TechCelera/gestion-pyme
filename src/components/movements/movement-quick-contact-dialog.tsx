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
  clientSegment: string
  onClientSegmentChange: (value: string) => void
  services: string
  onServicesChange: (value: string) => void
  saving: boolean
  onSave: () => void
}

export function MovementQuickContactDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  clientSegment,
  onClientSegmentChange,
  services,
  onServicesChange,
  saving,
  onSave,
}: MovementQuickContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo contacto</DialogTitle>
          <DialogDescription>
            Queda en tu empresa y seleccionado en esta línea. El tipo cliente/proveedor sigue el movimiento.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Nombre o razón social"
            />
          </div>
          <div className="space-y-1">
            <Label>Segmento (opcional)</Label>
            <Input
              value={clientSegment}
              onChange={(e) => onClientSegmentChange(e.target.value)}
              placeholder="ej. particular, corporativo"
            />
          </div>
          <div className="space-y-1">
            <Label>Servicios asociados (opcional)</Label>
            <Input
              value={services}
              onChange={(e) => onServicesChange(e.target.value)}
              placeholder="Texto libre"
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
            disabled={saving}
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90"
          >
            {saving ? 'Guardando...' : 'Crear contacto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
