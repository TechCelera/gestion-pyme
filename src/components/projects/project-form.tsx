'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  FormField,
  FormInput,
  FormMoneyInput,
  FormSelectTrigger,
} from '@/components/ui/form-controls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { createProject, updateProject, type Project } from '@/lib/actions/projects'
import { moneyInputToNumber } from '@/lib/utils/money-input'

interface ProjectFormProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  project?: Project | null
  projects: Project[]
}

function flattenProjects(items: Project[], depth = 0): Array<{ id: string; label: string }> {
  return items.flatMap((item) => {
    const prefix = depth > 0 ? `${'— '.repeat(depth)}` : ''
    const row = { id: item.id, label: `${prefix}${item.name}` }
    const children = item.children ? flattenProjects(item.children, depth + 1) : []
    return [row, ...children]
  })
}

export function ProjectForm({ isOpen, onClose, onSaved, project, projects }: ProjectFormProps) {
  const [name, setName] = useState('')
  const [parentProjectId, setParentProjectId] = useState<string>('none')
  const [budgetAmount, setBudgetAmount] = useState('0')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!project
  const availableParents = useMemo(() => {
    const rows = flattenProjects(projects)
    if (!project) return rows
    return rows.filter((item) => item.id !== project.id)
  }, [projects, project])

  const resetForm = useCallback(() => {
    setName('')
    setParentProjectId('none')
    setBudgetAmount('0')
    setStartDate('')
    setEndDate('')
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      if (project) {
        setName(project.name)
        setParentProjectId(project.parentProjectId ?? 'none')
        setBudgetAmount(String(project.budgetAmount ?? 0))
        setStartDate(project.startDate ?? '')
        setEndDate(project.endDate ?? '')
      } else if (isOpen) {
        resetForm()
      }
    })
  }, [project, isOpen, resetForm])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('El nombre del proyecto es requerido')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        name: name.trim(),
        parentProjectId: parentProjectId === 'none' ? null : parentProjectId,
        budgetAmount: moneyInputToNumber(budgetAmount) || 0,
        startDate: startDate || null,
        endDate: endDate || null,
      }

      const result = isEditing && project
        ? await updateProject(project.id, payload)
        : await createProject(payload)

      if (!result.success) {
        toast.error(result.error ?? 'No se pudo guardar el proyecto')
        return
      }

      toast.success(isEditing ? 'Proyecto actualizado' : 'Proyecto creado')
      handleClose()
      onSaved()
    } catch {
      toast.error('Error inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  const parentLabel = availableParents.find((item) => item.id === parentProjectId)?.label

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b space-y-1">
          <SheetTitle className="text-lg">
            {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Modifica los datos del proyecto'
              : 'Completa los datos para crear un nuevo proyecto o subproyecto'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <FormField label="Nombre" htmlFor="projectName" alignControl>
              <FormInput
                id="projectName"
                value={name}
                placeholder="Ej: Expansión Sede Norte"
                onChange={(event) => setName(event.target.value)}
                disabled={isSaving}
              />
            </FormField>

            <FormField label="Proyecto padre" htmlFor="parentProject" alignControl>
              <Select
                value={parentProjectId}
                onValueChange={(value) => setParentProjectId(value ?? 'none')}
                disabled={isSaving}
              >
                <FormSelectTrigger id="parentProject">
                  <SelectValue>
                    {parentProjectId === 'none'
                      ? 'Sin padre (proyecto raíz)'
                      : (parentLabel ?? 'Seleccione')}
                  </SelectValue>
                </FormSelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin padre (proyecto raíz)</SelectItem>
                  {availableParents.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Presupuesto" htmlFor="budget" alignControl>
              <FormMoneyInput
                id="budget"
                value={budgetAmount}
                onValueChange={setBudgetAmount}
                currency="ARS"
                disabled={isSaving}
              />
            </FormField>

            <FormField label="Inicio" htmlFor="startDate" alignControl>
              <FormInput
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={isSaving}
              />
            </FormField>

            <FormField label="Fin" htmlFor="endDate" alignControl>
              <FormInput
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                disabled={isSaving}
              />
            </FormField>
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
            ) : isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
