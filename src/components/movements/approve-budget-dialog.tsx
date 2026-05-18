'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ApproveBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (note: string) => Promise<void>
  isSubmitting?: boolean
}

export function ApproveBudgetDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: ApproveBudgetDialogProps) {
  const [note, setNote] = useState('')

  function handleOpenChange(next: boolean) {
    if (!next) setNote('')
    onOpenChange(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onConfirm(note.trim())
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isSubmitting}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Aprobar excepción de presupuesto</DialogTitle>
            <DialogDescription>
              Este movimiento supera el presupuesto o el plazo del proyecto. Autorizá la excepción
              antes de aprobar el movimiento en la tabla.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="budget-note">Nota (opcional)</Label>
            <textarea
              id="budget-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              placeholder="Ej: ampliación acordada con el cliente"
              className={cn(
                'flex w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none',
                'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                'disabled:pointer-events-none disabled:opacity-50 md:text-sm dark:bg-input/30'
              )}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Autorizar excepción'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
