import { Navigate, useParams } from 'react-router-dom'
import { AssembliesAdminPage } from './AssembliesAdminPage'

export function AssemblyManagementPage() {
  const id = Number(useParams().id)
  return Number.isSafeInteger(id) && id > 0
    ? <AssembliesAdminPage assemblyId={id} />
    : <Navigate to="/app/admin/assemblies" replace />
}
