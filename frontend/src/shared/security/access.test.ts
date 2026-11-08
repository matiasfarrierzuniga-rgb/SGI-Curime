import { describe, expect, it } from "vitest";
import { ACCESS_CAPABILITIES, hasCapability } from "./access";

describe("permission-code access policy", () => {
  it("recognizes the 91-code canonical legacy and V2 catalog without legacy drift", () => {
    expect(ACCESS_CAPABILITIES).toHaveLength(91);
    expect(ACCESS_CAPABILITIES).toContain("system.rbac.manage");
    expect(ACCESS_CAPABILITIES).not.toContain("abs.justifications.read");
  });

  it("grants only codes delivered in session", () => {
    const codes = ["adm.assemblies.read", "adm.justifications.approve"];
    expect(hasCapability(codes, "adm.assemblies.read")).toBe(true);
    expect(hasCapability(codes, "adm.justifications.reject")).toBe(false);
  });

  it("never derives access from role names or arbitrary values", () => {
    expect(hasCapability("Administrador", "adm.assemblies.manage")).toBe(false);
    expect(
      hasCapability({ name: "Administrador" }, "adm.assemblies.manage"),
    ).toBe(false);
    expect(hasCapability(null, "adm.assemblies.manage")).toBe(false);
  });

  it("keeps V2 actor outcomes driven only by server-delivered permissions", () => {
    const technicalAdministrator = ["usr.users.read", "system.rbac.manage"];
    const president = ["erp.dashboard.read", "padron.affiliate.read"];
    const treasurer = ["fin.charges.read", "fin.payments.record"];
    const communityUser: string[] = [];

    expect(hasCapability(technicalAdministrator, "fin.payments.record")).toBe(
      false,
    );
    expect(hasCapability(president, "padron.affiliate.read")).toBe(true);
    expect(hasCapability(president, "system.rbac.manage")).toBe(false);
    expect(hasCapability(treasurer, "fin.payments.record")).toBe(true);
    expect(hasCapability(treasurer, "usr.users.read")).toBe(false);
    expect(hasCapability(communityUser, "erp.dashboard.read")).toBe(false);
  });
});
