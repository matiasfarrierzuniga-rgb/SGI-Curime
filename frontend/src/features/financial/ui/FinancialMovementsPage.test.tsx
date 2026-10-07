import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/features/auth";
import {
  useFinancialMovementDetail,
  useFinancialMovementsList,
  useFinancialMovementSummary,
} from "../hooks/useFinancial";
import { FinancialMovementsPage } from "./FinancialMovementsPage";

vi.mock("@/features/auth", () => ({ useAuth: vi.fn() }));
vi.mock("../hooks/useFinancial", () => ({
  useFinancialMovementsList: vi.fn(),
  useFinancialMovementSummary: vi.fn(),
  useFinancialMovementDetail: vi.fn(),
  useCreateFinancialMovement: vi.fn(),
}));

const movement = {
  id: 3,
  type: "INCOME",
  source: "MANUAL",
  status: "POSTED",
  amount: "1500.00",
  currency: "CRC",
  description: "Venta de comidas",
  reference: null,
  occurredAt: "2030-01-01T12:00:00.000Z",
  sourceId: null,
  recordedById: 7,
  createdAt: "2030-01-01T12:00:00.000Z",
  updatedAt: "2030-01-01T12:00:00.000Z",
} as const;

describe("FinancialMovementsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { permissionCodes: ["fin.movements.read", "fin.movements.create"] },
    } as never);
    vi.mocked(useFinancialMovementsList).mockReturnValue({
      isPending: false,
      isError: false,
      data: { data: [movement], total: 1, page: 1, limit: 20 },
    } as never);
    vi.mocked(useFinancialMovementSummary).mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        currency: "CRC",
        totalIncome: "1500.00",
        totalExpenses: "0.00",
        balance: "1500.00",
        incomeCount: 1,
        expenseCount: 0,
        movementCount: 1,
        incomeAverage: "1500.00",
        expenseAverage: "0.00",
        bySource: [
          {
            source: "MANUAL",
            incomeTotal: "1500.00",
            incomeCount: 1,
            expenseTotal: "0.00",
            expenseCount: 0,
          },
        ],
        confirmedPayments: {
          total: "1250.00",
          count: 1,
          byMethod: [{ method: "CASH", total: "1250.00", count: 1 }],
        },
      },
    } as never);
    vi.mocked(useFinancialMovementDetail).mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...movement, recordedBy: { id: 7, fullName: "Ana Pérez" } },
    } as never);
  });

  it("renders the operational report, movement list, supported filters, and detail action", () => {
    render(<FinancialMovementsPage />);
    expect(
      screen.getByRole("heading", { name: "Reporte operativo financiero" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Venta de comidas")).toBeInTheDocument();
    expect(screen.getAllByText("Ingresos")).toHaveLength(2);
    expect(screen.getByText("Movimientos de ingreso")).toBeInTheDocument();
    expect(
      screen.getByText("Promedio por movimiento de ingreso"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Distribución por fuente" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Pagos confirmados por método" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Efectivo")).toHaveLength(2);
    expect(screen.getAllByText("Manual")).toHaveLength(2);
    expect(screen.getAllByText("Registrado")).toHaveLength(2);
    expect(screen.getAllByText("Todos los movimientos")).toHaveLength(8);
    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "INCOME" },
    });
    expect(screen.getAllByText("Filtros aplicados")).toHaveLength(8);
    expect(useFinancialMovementsList).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "INCOME", page: 1, limit: 20 }),
    );
    expect(useFinancialMovementSummary).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "INCOME" }),
    );
    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2030-01-01" },
    });
    expect(useFinancialMovementSummary).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: "INCOME",
        dateFrom: "2030-01-01",
        dateTo: undefined,
      }),
    );
    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "POSTED" },
    });
    expect(useFinancialMovementsList).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "POSTED", page: 1 }),
    );
    fireEvent.change(screen.getByLabelText("Método"), {
      target: { value: "CHECK" },
    });
    expect(useFinancialMovementSummary).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: "CHECK", status: "POSTED" }),
    );
    fireEvent.change(screen.getByLabelText("Concepto o referencia"), {
      target: { value: "mantenimiento" },
    });
    expect(useFinancialMovementsList).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "mantenimiento", method: "CHECK" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle" }));
    expect(useFinancialMovementDetail).toHaveBeenLastCalledWith(3);
  });

  it("labels voided movements explicitly", () => {
    vi.mocked(useFinancialMovementsList).mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        data: [{ ...movement, status: "VOIDED" }],
        total: 1,
        page: 1,
        limit: 20,
      },
    } as never);
    render(<FinancialMovementsPage />);

    expect(screen.getAllByText("Anulado")).toHaveLength(2);
  });

  it("renders loading, error, and empty list states", () => {
    vi.mocked(useFinancialMovementsList).mockReturnValue({
      isPending: true,
      isError: false,
    } as never);
    const { rerender } = render(<FinancialMovementsPage />);
    expect(
      screen.getByText("Cargando movimientos financieros..."),
    ).toBeInTheDocument();
    vi.mocked(useFinancialMovementsList).mockReturnValue({
      isPending: false,
      isError: true,
      error: new Error("falló"),
    } as never);
    rerender(<FinancialMovementsPage />);
    expect(
      screen.getByText("No fue posible cargar los movimientos"),
    ).toBeInTheDocument();
    vi.mocked(useFinancialMovementsList).mockReturnValue({
      isPending: false,
      isError: false,
      data: { data: [], total: 0, page: 1, limit: 20 },
    } as never);
    rerender(<FinancialMovementsPage />);
    expect(
      screen.getByText("No hay movimientos financieros"),
    ).toBeInTheDocument();
  });

  it("hides manual registration without create capability", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { permissionCodes: [] },
    } as never);
    render(<FinancialMovementsPage />);
    expect(
      screen.queryByRole("button", { name: "Registrar movimiento" }),
    ).not.toBeInTheDocument();
  });
});
