'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import {
  FormSheet,
  FormSheetHeader,
  FormSheetBody,
  FormSheetActions,
} from '@/components/ui/form-sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { createCategory, updateCategory } from '@/lib/actions/categories'
import type { Category } from '@/lib/actions/categories'
import { CATEGORY_TYPE_OPTIONS } from '@/lib/constants'
import { normalizeCategoryType, type CategoryType } from '@/lib/validations/category'
interface CategoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  category?: Category | null
}

export function CategoryForm({ isOpen, onClose, onSaved, category }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [categoryType, setCategoryType] = useState<CategoryType>('income')
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!category

  const resetForm = useCallback(() => {
    setName('')
    setCategoryType('income')
  }, [])

  // Pre-fill form when editing
  useEffect(() => {
    queueMicrotask(() => {
      if (category) {
        setName(category.name)
        setCategoryType(normalizeCategoryType(category.type))
      } else if (isOpen) {
        resetForm()
      }
    })
  }, [category, isOpen, resetForm])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      if (isEditing && category) {
        const result = await updateCategory(category.id, {
          name: name.trim(),
          type: categoryType,
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
          type: categoryType,
        })
        if (result.success) {
          toast.success('Categoría creada exitosamente')
          handleClose()
          onSaved()
        } else {
          toast.error(result.error || 'Error al crear la categoría')
        }
      }
    } catch {
      toast.error('Error inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  const typeLabel = CATEGORY_TYPE_OPTIONS.find((t) => t.value === categoryType)?.label ?? ''

  return (
    <FormSheet open={isOpen} onClose={handleClose}>
      <FormSheetHeader
        title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
        description={
          isEditing
            ? 'Modifica los datos de la categoría'
            : 'Completa los datos para crear una nueva categoría'
        }
      />

      <FormSheetBody>
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
                value={categoryType}
                onValueChange={(v) => setCategoryType((v as CategoryType) ?? 'income')}
                disabled={isSaving}
              >
                <SelectTrigger id="categoryType" className="w-full">
                  {typeLabel || <span className="text-muted-foreground">Elegí un tipo</span>}
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ingreso o gasto, según cómo clasifiques el movimiento.
              </p>
            </div>
      </FormSheetBody>

      <FormSheetActions
        onCancel={handleClose}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
      />
    </FormSheet>
  )
}
