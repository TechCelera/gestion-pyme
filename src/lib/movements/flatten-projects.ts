import type { Project } from '@/lib/actions/projects'

export type FlatProjectOption = { id: string; name: string }

export function flattenProjects(
  items: Project[],
  depth = 0
): FlatProjectOption[] {
  return items.flatMap((item) => {
    const prefix = depth > 0 ? `${'— '.repeat(depth)}` : ''
    const current = { id: item.id, name: `${prefix}${item.name}` }
    const children = item.children ? flattenProjects(item.children, depth + 1) : []
    return [current, ...children]
  })
}
