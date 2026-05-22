'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  FormSheet,
  FormSheetHeader,
  FormSheetBody,
  FormSheetActions,
} from '@/components/ui/form-sheet'
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
    <FormSheet open={isOpen} onClose={handleClose}>
      <FormSheetHeader
        title={isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        description={
          isEditing
            ? 'Modifica los datos del proyecto'
            : 'Completa los datos para crear un nuevo proyecto o subproyecto'
        }
      />

      <FormSheetBody>
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
      </FormSheetBody>

      <FormSheetActions
        onCancel={handleClose}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}
      />
    </FormSheet>
  )
}
