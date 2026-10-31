import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdministrativeListLayout, AdministrativeListResults } from "./AdministrativeListLayout"

describe("AdministrativeListLayout", () => {
  it("preserves a semantic results heading while presenting count and actions beside the table", () => {
    render(
      <AdministrativeListLayout header={<header>Encabezado</header>} filters={<form aria-label="Filtros">Filtros</form>}>
        <AdministrativeListResults count="2 personas encontradas" actions="Seleccione una persona para ver el detalle.">
          <table aria-label="Personas"><tbody><tr><td>Ana</td></tr></tbody></table>
        </AdministrativeListResults>
      </AdministrativeListLayout>,
    )

    expect(screen.getByRole("heading", { name: "Resultados" })).toHaveClass("sr-only")
    expect(screen.getByText("2 personas encontradas")).toHaveAttribute("aria-live", "polite")
    expect(screen.getByRole("table", { name: "Personas" })).toBeInTheDocument()
  })
})
