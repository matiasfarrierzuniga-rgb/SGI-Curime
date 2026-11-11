import { describe, expect, it } from "vitest";
import {
  getRoleName,
  homePathForRole,
} from "./roles";

describe("shared security role policy", () => {
  it("reads role objects for presentation only", () => {
    expect(getRoleName({ name: "Administrador" })).toBe("Administrador");
  });

  it("handles nullish and empty role values safely", () => {
    expect(getRoleName(null)).toBeUndefined();
    expect(getRoleName(undefined)).toBeUndefined();
    expect(getRoleName({})).toBeUndefined();
    expect(getRoleName({ name: null })).toBeUndefined();
    expect(getRoleName(null)).toBeUndefined();
    expect(homePathForRole(null)).toBe("/servicios");
  });

  it("routes post-login home by role", () => {
    expect(homePathForRole("Administrador", true)).toBe("/app");
    expect(homePathForRole({ name: "Administrador" }, true)).toBe("/app");
    expect(homePathForRole("Gestor de Inventario", true)).toBe("/app");
    expect(homePathForRole("Administrador", false)).toBe("/servicios");
    expect(homePathForRole(undefined)).toBe("/servicios");
    expect(homePathForRole("ROLE_COMMUNITY_USER")).toBe("/mi-comunidad");
    expect(homePathForRole("Cuenta comunitaria")).toBe("/servicios");
  });
});
