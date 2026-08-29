import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EmptyState } from "./EmptyState"
import { ErrorState } from "./ErrorState"
import { LoadingState } from "./LoadingState"
import { MetricCard } from "./MetricCard"
import { PageHeader } from "./PageHeader"
import { StatusBadge } from "./StatusBadge"

describe("Foundation UI states", () => {
  it("renders a page header with optional context, description, and actions", () => {
    render(<PageHeader context="Administración" title="Usuarios" description="Gestione las cuentas." actions={<button>Crear usuario</button>} />)

    expect(screen.getByRole("heading", { level: 1, name: "Usuarios" })).toBeInTheDocument()
    expect(screen.getByText("Administración")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Crear usuario" })).toBeInTheDocument()
  })

  it.each(["success", "warning", "danger", "info", "neutral"] as const)("renders %s status with text", (variant) => {
    render(<StatusBadge variant={variant}>{variant}</StatusBadge>)

    expect(screen.getByText(variant)).toHaveClass(`text-status-${variant}`)
  })

  it("renders empty, loading, and error states with their accessible semantics", () => {
    render(
      <>
        <EmptyState title="Sin resultados" description="Ajuste los filtros." action={<button>Limpiar</button>} />
        <LoadingState label="Cargando usuarios" />
        <ErrorState message="Intente nuevamente." action={<button>Reintentar</button>} />
      </>,
    )

    expect(screen.getByRole("heading", { name: "Sin resultados" })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Cargando usuarios")
    expect(screen.getByRole("alert")).toHaveTextContent("Intente nuevamente.")
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument()
  })

  it("renders metric content and optional supporting details", () => {
    render(<MetricCard label="Stock bajo" value={12} supportingText="Requiere revisión" state="warning" icon={<span>!</span>} />)

    expect(screen.getByText("Stock bajo")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("Requiere revisión")).toBeInTheDocument()
  })
})
