import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "./DataTable"

describe("DataTable", () => {
  it("provides semantic headers, controlled horizontal overflow, and row focus feedback", () => {
    render(
      <DataTable scrollLabel="Desplaza horizontalmente para ver todas las columnas">
        <caption>Listado institucional</caption>
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Persona</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          <DataTableRow>
            <DataTableCell><button type="button">Ver detalle</button></DataTableCell>
          </DataTableRow>
        </DataTableBody>
      </DataTable>,
    )

    expect(screen.getByRole("region", { name: "Desplaza horizontalmente para ver todas las columnas" })).toHaveClass("overflow-x-auto")
    expect(screen.getByRole("columnheader", { name: "Persona" })).toHaveAttribute("scope", "col")
    expect(screen.getByRole("columnheader", { name: "Persona" })).toHaveClass("bg-surface-muted", "border-border", "text-foreground")
    expect(screen.getByRole("row", { name: "Ver detalle" })).toHaveClass("hover:bg-surface-muted/60", "focus-within:bg-surface-muted/80")
  })

  it("announces loading and error states across every column", () => {
    const { rerender } = render(<DataTable columnCount={2} loading />)

    expect(screen.getByRole("status")).toHaveTextContent("Cargando datos…")
    expect(screen.getByRole("status").closest("td")).toHaveAttribute("colspan", "2")

    rerender(<DataTable columnCount={2} error="No fue posible cargar resultados." />)

    expect(screen.getByRole("alert")).toHaveTextContent("No fue posible cargar resultados.")
  })
})
