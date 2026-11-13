import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppHomePage } from "./AppHomePage";
import { inventoryReportsService } from "@/services/inventoryReportsService";

const auth = vi.hoisted(() => ({
  user: { fullName: "Ana Pérez", role: "Administrador" },
}));
vi.mock("@/features/auth", () => ({ useAuth: () => auth }));
vi.mock("@/features/admin-dashboard", () => ({
  AdminDashboard: () => (
    <section>
      <h2>Indicadores administrativos</h2>
      <p>Afiliados activos</p>
    </section>
  ),
  InstitutionalDashboardWelcome: ({ fullName }: { fullName?: string }) => (
    <section>
      <h1>Buenos días{fullName ? `, ${fullName.split(" ")[0]}` : ""}</h1>
    </section>
  ),
  canUseAdministrativeDashboard: (permissionCodes?: readonly string[]) =>
    permissionCodes?.includes("erp.dashboard.read") === true &&
    permissionCodes.includes("adm.affiliates.read"),
}));
vi.mock("@/services/inventoryReportsService", () => ({
  inventoryReportsService: { summary: vi.fn() },
}));

const summary = {
  totalItems: 12,
  activeItems: 10,
  inactiveItems: 2,
  totalCategories: 4,
  lowStockCount: 2,
  outOfStockCount: 1,
  activeLoans: 3,
  overdueLoans: 1,
};

describe("AppHomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inventoryReportsService.summary).mockResolvedValue(summary);
  });

  it("renders administrative metrics only for a dashboard session with the affiliated registry read capability", async () => {
    auth.user = {
      fullName: "Ana Pérez",
      role: "Administrador",
      permissionCodes: ["erp.dashboard.read", "adm.affiliates.read"],
    };
    render(
      <MemoryRouter>
        <AppHomePage />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Afiliados activos")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Indicadores administrativos" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Accesos rápidos" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Accesos autorizados" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: /Gestionar usuarios|Revisar solicitudes|Consultar bitácora|Movimientos financieros/,
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Módulo en desarrollo/i)).not.toBeInTheDocument();
    expect(inventoryReportsService.summary).not.toHaveBeenCalled();
  });

  it("renders the administrative dashboard for the canonical system administrator", async () => {
    auth.user = {
      fullName: "Ana Pérez",
      role: "ROLE_SYSTEM_ADMIN",
      permissionCodes: ["erp.dashboard.read", "adm.affiliates.read"],
    };
    render(
      <MemoryRouter>
        <AppHomePage />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Afiliados activos")).toBeInTheDocument();
  });

  it("keeps Operator on the shared shell and inventory summary without requesting administrative metrics", async () => {
    auth.user = {
      fullName: "Luis Mora",
      role: "ROLE_INSTITUTIONAL_OPERATOR",
      permissionCodes: ["erp.dashboard.read", "inv.inventory.read"],
    };
    render(
      <MemoryRouter>
        <AppHomePage />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Artículos activos")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Accesos rápidos" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: /Abrir inventario|Gestionar usuarios|Revisar solicitudes|Consultar bitácora/,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Indicadores administrativos" }),
    ).not.toBeInTheDocument();
    expect(inventoryReportsService.summary).toHaveBeenCalledTimes(1);
  });

  it("keeps Presidency on the shared institutional shell without administrative data", () => {
    auth.user = {
      fullName: "Sofía Rojas",
      role: "ROLE_INSTITUTIONAL_PRESIDENT",
      permissionCodes: ["erp.dashboard.read"],
    };
    render(
      <MemoryRouter>
        <AppHomePage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Buenos días, Sofía" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Accesos autorizados" }),
    ).toBeInTheDocument();
    expect(inventoryReportsService.summary).not.toHaveBeenCalled();
  });

  it("keeps authorized destinations for Secretariat", () => {
    auth.user = {
      fullName: "Diego Mora",
      role: "ROLE_INSTITUTIONAL_SECRETARY",
      permissionCodes: ["erp.dashboard.read"],
    };
    render(
      <MemoryRouter>
        <AppHomePage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Buenos días, Diego" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Accesos autorizados" }),
    ).toBeInTheDocument();
  });

  it("shows a clear set of real account actions to community users", () => {
    auth.user = { fullName: "María Solano", role: "Vecino/Afiliado" };
    render(
      <MemoryRouter>
        <AppHomePage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: /Solicitar una reserva/ }),
    ).toHaveAttribute("href", "/servicios/reservas");
    expect(
      screen.getByRole("link", { name: /Enviar justificación/ }),
    ).toHaveAttribute("href", "/app/affiliate/absence-justifications/new");
    expect(
      screen.getByRole("link", { name: /Mis justificaciones/ }),
    ).toHaveAttribute("href", "/app/affiliate/justifications");
    expect(screen.getByRole("link", { name: "Mi perfil" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("link", { name: "Afiliación" })).toHaveAttribute(
      "href",
      "/afiliacion",
    );
    expect(screen.getByRole("link", { name: "Eventos" })).toHaveAttribute(
      "href",
      "/eventos",
    );
    expect(
      screen.queryByRole("link", {
        name: /Gestionar usuarios|Revisar solicitudes|Consultar bitácora/,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Accesos rápidos" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Indicadores administrativos" }),
    ).not.toBeInTheDocument();
    expect(inventoryReportsService.summary).not.toHaveBeenCalled();
  });

  it("keeps Treasury on the shared shell without administrative metrics", () => {
    auth.user = {
      fullName: "Carlos Ruiz",
      role: "ROLE_INSTITUTIONAL_TREASURER",
      permissionCodes: [
        "erp.dashboard.read",
        "usr.profile.read",
        "fin.charges.read",
        "fin.movements.read",
      ],
    };
    render(
      <MemoryRouter>
        <AppHomePage />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("heading", { name: "Accesos rápidos" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Cargos y pagos" }),
    ).toHaveAttribute("href", "/app/financial/charges");
    expect(
      screen.getByRole("link", { name: "Movimientos financieros" }),
    ).toHaveAttribute("href", "/app/financial/movements");
    expect(screen.queryByText("Ingresos")).not.toBeInTheDocument();
    expect(screen.queryByText("Egresos")).not.toBeInTheDocument();
    expect(screen.queryByText("Balance")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Afiliación" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Indicadores administrativos" }),
    ).not.toBeInTheDocument();
    expect(inventoryReportsService.summary).not.toHaveBeenCalled();
  });
});
