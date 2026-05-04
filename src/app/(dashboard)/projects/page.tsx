'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { createProject, getProjects, type Project } from '@/lib/actions/projects'

function flattenProjects(items: Project[], depth = 0): Array<{ id: string; label: string }> {
  return items.flatMap((item) => {
    const prefix = depth > 0 ? `${'— '.repeat(depth)}` : ''
    const row = { id: item.id, label: `${prefix}${item.name}` }
    const children = item.children ? flattenProjects(item.children, depth + 1) : []
    return [row, ...children]
  })
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [parentProjectId, setParentProjectId] = useState<string>('none')
  const [budgetAmount, setBudgetAmount] = useState('0')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const flatProjects = useMemo(() => flattenProjects(projects), [projects])

  const loadProjects = async () => {
    setIsLoading(true)
    const result = await getProjects()
    if (result.success && result.data) {
      setProjects(result.data)
    } else {
      toast.error(result.error ?? 'No se pudieron cargar los proyectos')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('El nombre del proyecto es requerido')
      return
    }
    const result = await createProject({
      name: name.trim(),
      parentProjectId: parentProjectId === 'none' ? null : parentProjectId,
      budgetAmount: Number(budgetAmount || 0),
      startDate: startDate || null,
      endDate: endDate || null,
    })

    if (!result.success) {
      toast.error(result.error ?? 'No se pudo crear el proyecto')
      return
    }

    toast.success('Proyecto creado')
    setName('')
    setParentProjectId('none')
    setBudgetAmount('0')
    setStartDate('')
    setEndDate('')
    await loadProjects()
  }

  const renderRows = (items: Project[], depth = 0): JSX.Element[] => {
    return items.map((project) => {
      const usage = project.budgetAmount > 0
        ? ((project.spentAmount ?? 0) / project.budgetAmount) * 100
        : 0
      return (
        <div key={project.id}>
          <div className="grid grid-cols-4 gap-4 py-2 text-sm border-b">
            <div>{`${'  '.repeat(depth)}${project.name}`}</div>
            <div>{project.budgetAmount.toLocaleString('es-AR')}</div>
            <div>{(project.spentAmount ?? 0).toLocaleString('es-AR')}</div>
            <div className={usage > 100 ? 'text-red-600 font-medium' : ''}>{usage.toFixed(1)}%</div>
          </div>
          {project.children && project.children.length > 0 ? renderRows(project.children, depth + 1) : null}
        </div>
      )
    })
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <p className="text-sm text-muted-foreground">
          Administra proyectos y subproyectos con presupuesto y plazo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Proyecto / Subproyecto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Nombre</Label>
            <Input id="projectName" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentProject">Proyecto padre</Label>
            <Select value={parentProjectId} onValueChange={(v) => setParentProjectId(v ?? 'none')}>
              <SelectTrigger id="parentProject" className="w-full">
                {parentProjectId === 'none'
                  ? 'Sin padre (proyecto raíz)'
                  : flatProjects.find((project) => project.id === parentProjectId)?.label ?? 'Seleccione'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin padre (proyecto raíz)</SelectItem>
                {flatProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Presupuesto</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Inicio</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Fin</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-[#7B68EE] hover:bg-[#7B68EE]/90" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Crear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consumo Presupuestario</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando proyectos...</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 text-xs uppercase text-muted-foreground pb-2 border-b">
                <div>Proyecto</div>
                <div>Presupuesto</div>
                <div>Ejecutado</div>
                <div>Uso</div>
              </div>
              {renderRows(projects)}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
