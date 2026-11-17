import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getErpEntryPath, getErpNavigation } from './erpNavigation'

// Load the actual backend assignment contract, not duplicate role grants in frontend fixtures.
// If the canonical role catalog changes, this test observes the new values in the same PR.
const source = readFileSync(resolve(process.cwd(), '../backend/src/auth/domain/policies/canonical-role-grants.ts'), 'utf8')
const roles = [
  'ROLE_INSTITUTIONAL_PRESIDENT',
  'ROLE_INSTITUTIONAL_SECRETARY',
  'ROLE_INSTITUTIONAL_TREASURER',
  'ROLE_INSTITUTIONAL_OPERATOR',
  'ROLE_SYSTEM_ADMIN',
  'ROLE_COMMUNITY_USER',
] as const

function canonicalGrants(role: (typeof roles)[number]): string[] {
  const contract = source.split('export const CANONICAL_ROLE_GRANTS:')[1]?.split('export function validateCanonicalRoleGrants')[0]
  if (!contract) throw new Error('Canonical grant contract not found')
  const match = contract.match(new RegExp('\\b' + role + ': \\[([\\s\\S]*?)\\],'))
  if (!match) throw new Error('Role not found in canonical grants: ' + role)
  return [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1])
}

function visibleLabels(grants: readonly string[]): string[] {
  return getErpNavigation(grants).flatMap(section => section.items.map(item => item.label))
}

const expectedByRole: Record<(typeof roles)[number], readonly string[]> = {
  ROLE_INSTITUTIONAL_PRESIDENT: ['Inicio', 'Asambleas', 'Afiliados / padrón', 'Solicitudes de afiliación', 'Eventos', 'Mi perfil'],
  ROLE_INSTITUTIONAL_SECRETARY: ['Inicio', 'Junta Directiva', 'Asambleas', 'Afiliados / padrón', 'Solicitudes de afiliación', 'Eventos', 'Voluntariado', 'Mi perfil'],
  ROLE_INSTITUTIONAL_TREASURER: ['Inicio', 'Finanzas', 'Donaciones', 'Solicitudes de donación', 'Mi perfil'],
  ROLE_INSTITUTIONAL_OPERATOR: ['Inicio', 'Eventos', 'Reservas', 'Inventario', 'Mi perfil'],
  ROLE_SYSTEM_ADMIN: ['Inicio', 'Perfil institucional', 'Junta Directiva', 'Asambleas', 'Usuarios y cuentas', 'Afiliados / padrón', 'Justificaciones de ausencia', 'Emprendimientos', 'Voluntariado', 'Reservas', 'Inventario', 'Finanzas', 'Donaciones', 'Solicitudes de donación', 'Bitácora', 'Mi perfil'],
  ROLE_COMMUNITY_USER: [],
}

describe('ERP sidebar — six canonical backend roles', () => {
  it.each(roles)('exposes only approved navigation to %s', role => {
    const grants = canonicalGrants(role)
    expect(new Set(grants).size).toBe(grants.length)
    expect(visibleLabels(grants)).toEqual(expectedByRole[role])
    const paths = getErpNavigation(grants).flatMap(section => section.items.flatMap(item => [item.path, ...(item.children?.map(c => c.path) ?? [])]))
    expect(paths).not.toContain('/app/assemblies/mine')
    expect(paths).not.toContain('/app/affiliate/absence-justifications/new')
    expect(paths).not.toContain('/app/affiliate/justifications')
    expect(paths).not.toContain('/app/documents')
    expect(paths).not.toContain('/app/maintenance')
  })

  it('gives community users no ERP route and no administrative link', () => {
    const grants = canonicalGrants('ROLE_COMMUNITY_USER')
    expect(grants).toEqual([])
    expect(getErpNavigation(grants)).toEqual([])
    expect(getErpEntryPath(grants)).toBe('/profile')
  })

  it('does not accidentally expose privileged actions through read-only roles', () => {
    expect(canonicalGrants('ROLE_SYSTEM_ADMIN')).not.toContain('adm.institutional-board.manage')
    expect(canonicalGrants('ROLE_SYSTEM_ADMIN')).not.toContain('fin.payments.record')
    expect(canonicalGrants('ROLE_INSTITUTIONAL_PRESIDENT')).not.toContain('inventory.item.manage')
    expect(canonicalGrants('ROLE_INSTITUTIONAL_OPERATOR')).not.toContain('fin.movements.read')
    expect(canonicalGrants('ROLE_INSTITUTIONAL_TREASURER')).not.toContain('adm.institutional-board.manage')
  })
})
