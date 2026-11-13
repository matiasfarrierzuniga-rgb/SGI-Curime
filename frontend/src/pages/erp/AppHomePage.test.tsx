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
  SecretaryDashboard: () => <section><h2>Indicadores de Secretaría</h2></section>,
  PresidentDashboard: () => <section><h2>Indicadores de Presidencia</h2></section>,
  TreasuryDashboard: () => <section><h2>Indicadores de Tesorería</h2></section>,
  OperatorDashboard: () => <section><h2>Indicadores operativos</h2></section>,
  InstitutionalDashboardWelcome: ({ fullName }: { fullName?: string }) => (
    <section>
      <h1>Buenos días{fullName ? `, ${fullName.split(" ")[0]}` : ""}</h1>
    </section>
  ),
  canUseAdministrativeDashboard: (permissionCodes?: readonly string[]) =>
    permissionCodes?.includes("erp.dashboard.read") === true &&
    permissionCodes.includes("adm.affiliates.read"),
  canUseSecretaryDashboard: (permissionCodes?: readonly string[]) =>
    permissionCodes?.includes("erp.dashboard.read") === true &&
    permissionCodes.includes("padron.application.review") &&
    permissionCodes.includes("governance.assembly.session"),
  canUsePresidentDashboard: (permissionCodes?: readonly string[]) =>
    permissionCodes?.includes("erp.dashboard.read") === true &&
    permissionCodes.includes("padron.application.review") &&
    permissionCodes.includes("governance.assembly.session"),
  canUseTreasuryDashboard: (permissionCodes?: readonly string[]) =>
    permissionCodes?.includes("erp.dashboard.read") === true,
  canUseOperatorDashboard: (permissionCodes?: readonly string[]) =>
    permissionCodes?.includes("erp.dashboard.read") === true,
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

  it("renders the specialized operational dashboard with inventory data when authorized", async () => {
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
    expect(await screen.findByText("Indicadores operativos")).toBeInTheDocument();
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

  it("renders the specialized dashboard for Secretariat with its real dashboard capabilities", () => {
    auth.user = {
      fullName: "Diego Mora",
      role: "ROLE_INSTITUTIONAL_SECRETARY",
      permissionCodes: ["erp.dashboard.read", "padron.application.review", "governance.assembly.session"],
    };
    render(<MemoryRouter><AppHomePage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Indicadores de Secretaría" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Accesos autorizados" })).not.toBeInTheDocument();
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

  it("renders the specialized treasury dashboard when financial capabilities are available", () => {
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
    expect(screen.getByRole("heading", { name: "Indicadores de Tesorería" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Afiliación" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Indicadores administrativos" }),
    ).not.toBeInTheDocument();
    expect(inventoryReportsService.summary).not.toHaveBeenCalled();
  });
});
