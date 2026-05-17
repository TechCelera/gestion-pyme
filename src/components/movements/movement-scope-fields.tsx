'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FlatProjectOption } from '@/lib/movements/flatten-projects'

export type MovementScopeFieldsProps = {
  idPrefix?: string
  movementScope: 'general' | 'project'
  onMovementScopeChange: (scope: 'general' | 'project') => void
  fundOwner: 'company' | 'client_advance'
  onFundOwnerChange: (owner: 'company' | 'client_advance') => void
  projectId: string
  onProjectIdChange: (id: string) => void
  flatProjects: FlatProjectOption[]
  projectLabel: string
  isLoading?: boolean
  isLoadingData?: boolean
}

export function MovementScopeFields({
  idPrefix = '',
  movementScope,
  onMovementScopeChange,
  fundOwner,
  onFundOwnerChange,
  projectId,
  onProjectIdChange,
  flatProjects,
  projectLabel,
  isLoading,
  isLoadingData,
}: MovementScopeFieldsProps) {
  const scopeId = `${idPrefix}scope`
  const fundId = `${idPrefix}fundOwner`
  const projectFieldId = `${idPrefix}project`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={scopeId}>Ámbito</Label>
          <Select
            value={movementScope}
            onValueChange={(value) => {
              const scope = (value as 'general' | 'project') ?? 'general'
              onMovementScopeChange(scope)
              if (scope === 'general') onProjectIdChange('')
            }}
            disabled={isLoading}
          >
            <SelectTrigger id={scopeId} className="w-full">
              <SelectValue>
                {movementScope === 'general' ? 'General empresa' : 'Proyecto'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General empresa</SelectItem>
              <SelectItem value="project">Proyecto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={fundId}>Origen de fondos</Label>
          <Select
            value={fundOwner}
            onValueChange={(value) =>
              onFundOwnerChange((value as 'company' | 'client_advance') ?? 'company')
            }
            disabled={isLoading}
          >
            <SelectTrigger id={fundId} className="w-full">
              <SelectValue>
                {fundOwner === 'company' ? 'Fondos empresa' : 'Anticipo cliente'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Fondos empresa</SelectItem>
              <SelectItem value="client_advance">Anticipo cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {movementScope === 'project' && (
        <div className="space-y-2">
          <Label htmlFor={projectFieldId}>Proyecto</Label>
          <Select
            value={projectId}
            onValueChange={(value) => onProjectIdChange(value ?? '')}
            disabled={isLoading || isLoadingData}
          >
            <SelectTrigger id={projectFieldId} className="w-full">
              <SelectValue>
                <span className="block truncate" title={projectLabel}>
                  {projectLabel || 'Elegí proyecto'}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {flatProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
