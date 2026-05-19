'use client'

import {
  FormField,
  FormSelectTrigger,
} from '@/components/ui/form-controls'
import {
  Select,
  SelectContent,
  SelectItem,
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
        <FormField label="Ámbito" htmlFor={scopeId} alignControl>
          <Select
            value={movementScope}
            onValueChange={(value) => {
              const scope = (value as 'general' | 'project') ?? 'general'
              onMovementScopeChange(scope)
              if (scope === 'general') onProjectIdChange('')
            }}
            disabled={isLoading}
          >
            <FormSelectTrigger id={scopeId}>
              <SelectValue>
                {movementScope === 'general' ? 'General empresa' : 'Proyecto'}
              </SelectValue>
            </FormSelectTrigger>
            <SelectContent>
              <SelectItem value="general">General empresa</SelectItem>
              <SelectItem value="project">Proyecto</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Origen de fondos" htmlFor={fundId} alignControl>
          <Select
            value={fundOwner}
            onValueChange={(value) =>
              onFundOwnerChange((value as 'company' | 'client_advance') ?? 'company')
            }
            disabled={isLoading}
          >
            <FormSelectTrigger id={fundId}>
              <SelectValue>
                {fundOwner === 'company' ? 'Fondos empresa' : 'Anticipo cliente'}
              </SelectValue>
            </FormSelectTrigger>
            <SelectContent>
              <SelectItem value="company">Fondos empresa</SelectItem>
              <SelectItem value="client_advance">Anticipo cliente</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>
      {movementScope === 'project' ? (
        <FormField label="Proyecto" htmlFor={projectFieldId} alignControl>
          <Select
            value={projectId}
            onValueChange={(value) => onProjectIdChange(value ?? '')}
            disabled={isLoading || isLoadingData}
          >
            <FormSelectTrigger id={projectFieldId}>
              <SelectValue>
                <span className="block truncate" title={projectLabel}>
                  {projectLabel || 'Elegí proyecto'}
                </span>
              </SelectValue>
            </FormSelectTrigger>
            <SelectContent>
              {flatProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      ) : null}
    </div>
  )
}
