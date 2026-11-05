import { describe, expect, it } from "vitest";
import {
  ADMIN_ROLES,
  INVENTORY_ROLES,
  ROLE_ADMIN,
  ROLE_INVENTORY_MANAGER,
  canManageInventory,
  getRoleName,
  homePathForRole,
  isAdmin,
} from "./roles";

describe("shared security role policy", () => {
  it("exposes the exact backend role names", () => {
    expect(ROLE_ADMIN).toBe("Administrador");
    expect(ROLE_INVENTORY_MANAGER).toBe("Gestor de Inventario");
    expect(ADMIN_ROLES).toEqual([]);
    expect(INVENTORY_ROLES).toEqual([]);
  });

  it("derives admin access", () => {
    expect(isAdmin("Administrador")).toBe(false);
    expect(isAdmin("Gestor de Inventario")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("derives access from role objects by name", () => {
    expect(getRoleName({ name: "Administrador" })).toBe("Administrador");
    expect(isAdmin({ name: "Administrador" })).toBe(false);
    expect(canManageInventory({ name: "Gestor de Inventario" })).toBe(false);
  });

  it("handles nullish and empty role values safely", () => {
    expect(getRoleName(null)).toBeUndefined();
    expect(getRoleName(undefined)).toBeUndefined();
    expect(getRoleName({})).toBeUndefined();
    expect(getRoleName({ name: null })).toBeUndefined();
    expect(getRoleName(null)).toBeUndefined();
    expect(isAdmin({})).toBe(false);
    expect(canManageInventory(undefined)).toBe(false);
    expect(homePathForRole(null)).toBe("/servicios");
  });

  it("derives inventory access for admin and gestor only", () => {
    expect(canManageInventory("Gestor de Inventario")).toBe(false);
    expect(canManageInventory("Administrador")).toBe(false);
    expect(canManageInventory("Vecino/Afiliado")).toBe(false);
    expect(canManageInventory(null)).toBe(false);
  });

  it("routes post-login home by role", () => {
    expect(homePathForRole("Administrador", true)).toBe("/app");
    expect(homePathForRole({ name: "Administrador" }, true)).toBe("/app");
    expect(homePathForRole("Gestor de Inventario", true)).toBe("/app");
    expect(homePathForRole("Administrador", false)).toBe("/servicios");
    expect(homePathForRole(undefined)).toBe("/servicios");
    expect(homePathForRole("ROLE_COMMUNITY_USER")).toBe("/mi-comunidad");
    expect(homePathForRole("Cuenta comunitaria")).toBe("/mi-comunidad");
  });
});
