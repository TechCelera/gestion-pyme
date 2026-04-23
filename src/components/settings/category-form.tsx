'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { CATEGORY_TYPE_LABELS } from '@/lib/actions/categories'
import { createCategory, updateCategory } from '@/lib/actions/categories'
import type { Category } from '@/lib/actions/categories'
import { useAuthStore } from '@/stores/auth-store'

interface CategoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  category?: Category | null
}

const categoryTypes = Object.entries(CATEGORY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export function CategoryForm({ isOpen, onClose, onSaved, category }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState('income')
  const [isSaving, setIsSaving] = useState(false)

  const isDemoMode = useAuthStore((state) => state.isDemoMode)
  const isEditing = !!category

  // Pre-fill form when editing
  useEffect(() => {
    if (category) {
      setName(category.name)
      setType(category.type)
    } else if (isOpen) {
      resetForm()
    }
  }, [category, isOpen])

  const resetForm = () => {
    setName('')
    setType('income')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    if (isDemoMode) {
      toast.success(isEditing ? 'Categoría actualizada (demo)' : 'Categoría creada (demo)')
      handleClose()
      onSaved()
      return
    }

    setIsSaving(true)
    try {
      if (isEditing && category) {
        const result = await updateCategory(category.id, {
          name: name.trim(),
          type,
        })
        if (result.success) {
          toast.success('Categoría actualizada exitosamente')
          handleClose()
          onSaved()
        } else {
          toast.error(result.error || 'Error al actualizar la categoría')
        }
      } else {
        const result = await createCategory({
          name: name.trim(),
          type,
        })
        if (result.success) {
          toast.success('Categoría creada exitosamente')
          handleClose()
          onSaved()
        } else {
          toast.error(result.error || 'Error al crear la categoría')
        }
      }
    } catch (error) {
      toast.error('Error inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  const typeLabel = categoryTypes.find(t => t.value === type)?.label ?? ''

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b space-y-1">
          <SheetTitle className="text-lg">
            {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
          </SheetTitle>
          <SheetDescription>
            {isEditing ? 'Modifica los datos de la categoría' : 'Completa los datos para crear una nueva categoría'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nombre</Label>
              <Input
                id="categoryName"
                placeholder="Ej: Ventas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryType">Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v ?? 'income')}
                disabled={isSaving}
              >
                <SelectTrigger id="categoryType" className="w-full">
                  {typeLabel || <span className="text-muted-foreground">Seleccione tipo</span>}
                </SelectTrigger>
                <SelectContent>
                  {categoryTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <SheetFooter className="border-t bg-muted/50 px-6 py-4 flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-[#7B68EE] hover:bg-[#7B68EE]/90 w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}