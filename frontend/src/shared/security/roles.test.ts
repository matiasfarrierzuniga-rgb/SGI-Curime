import { describe, expect, it } from 'vitest'
import {
  ADMIN_ROLES,
  INVENTORY_ROLES,
  ROLE_ADMIN,
  ROLE_INVENTORY_MANAGER,
  ROLE_NAMES,
  LEGACY_ROLE_NAMES,
  canManageInventory,
  homePathForRole,
  isAdmin,
} from './roles'

describe('shared security role policy', () => {
  it('exposes the exact backend role names', () => {
    expect(ROLE_ADMIN).toBe('Administrador')
    expect(ROLE_INVENTORY_MANAGER).toBe('Gestor de Inventario')
    expect(ADMIN_ROLES).toEqual(['Administrador'])
    expect(INVENTORY_ROLES).toEqual(['Administrador', 'Gestor de Inventario'])
    expect(ROLE_NAMES).toEqual({ ADMIN: 'Administrador', TREASURER: 'Tesorero', INVENTORY_MANAGER: 'Gestor de Inventario', USER: 'Usuario' })
    expect(LEGACY_ROLE_NAMES.COMMUNITY_MEMBER).toBe('Vecino/Afiliado')
  })

  it('derives admin access', () => {
    expect(isAdmin('Administrador')).toBe(true)
    expect(isAdmin('Gestor de Inventario')).toBe(false)
    expect(isAdmin(undefined)).toBe(false)
    expect(isAdmin(null)).toBe(false)
  })

  it('derives inventory access for admin and gestor only', () => {
    expect(canManageInventory('Gestor de Inventario')).toBe(true)
    expect(canManageInventory('Administrador')).toBe(true)
    expect(canManageInventory('Vecino/Afiliado')).toBe(false)
    expect(canManageInventory(null)).toBe(false)
  })

  it('routes post-login home by role', () => {
    expect(homePathForRole('Administrador')).toBe('/app')
    expect(homePathForRole('Gestor de Inventario')).toBe('/app')
    expect(homePathForRole('Tesorero')).toBe('/mi-cuenta')
    expect(homePathForRole('Usuario')).toBe('/mi-cuenta')
    expect(homePathForRole('Vecino/Afiliado')).toBe('/mi-cuenta')
    expect(homePathForRole('Rol desconocido')).toBe('/mi-cuenta')
    expect(homePathForRole(undefined)).toBe('/login')
  })
})
