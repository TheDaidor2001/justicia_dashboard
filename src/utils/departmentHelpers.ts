import type { Department } from '@/types/user'

export function getDepartmentName(
  departmentId: string | undefined,
  departments: Department[]
): string {
  if (!departmentId) return 'Sin departamento'
  
  const department = departments.find(dept => dept.id === departmentId)
  return department?.nombre || department?.name || `Departamento ${departmentId}`
}

export function createDepartmentMap(departments: Department[]): Record<string, string> {
  return departments.reduce((map, dept) => {
    map[dept.id] = dept.nombre || dept.name || `Departamento ${dept.id}`
    return map
  }, {} as Record<string, string>)
}

export function formatDepartmentForDisplay(
  user: { departamento_id?: string; departamento?: Department },
  departments: Department[] = []
): string {
  // Si el usuario ya tiene el departamento poblado, usarlo
  if (user.departamento) {
    return user.departamento.nombre || user.departamento.name || 'Sin nombre'
  }
  
  // Si no, buscar en la lista de departamentos
  return getDepartmentName(user.departamento_id, departments)
}