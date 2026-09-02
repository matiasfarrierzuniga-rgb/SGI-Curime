import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Checkbox } from "./checkbox"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "./field"
import { Input } from "./input"
import { Select } from "./select"
import { Textarea } from "./textarea"

describe("shared UI primitives", () => {
  it("uses official button variants and accessible native controls", () => {
    render(
      <>
        <Button>Guardar</Button>
        <Button variant="outline">Cancelar</Button>
        <Button variant="destructive">Eliminar</Button>
        <label htmlFor="role">Rol</label>
        <Select id="role" defaultValue="member">
          <option value="admin">Administración</option>
          <option value="member">Afiliación</option>
        </Select>
        <label htmlFor="notes">Notas</label>
        <Textarea id="notes" />
        <label htmlFor="terms">Acepto términos</label>
        <Checkbox id="terms" />
      </>,
    )

    expect(screen.getByRole("button", { name: "Guardar" })).toHaveClass("bg-primary", "h-12")
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveClass("border-primary", "text-primary")
    expect(screen.getByRole("button", { name: "Eliminar" })).toHaveClass("bg-destructive")
    expect(screen.getByRole("combobox", { name: "Rol" })).toHaveValue("member")
    expect(screen.getByRole("textbox", { name: "Notas" })).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Acepto términos" })).toBeInTheDocument()
  })

  it("associates field labels, descriptions, and external errors with its control", () => {
    render(
      <Field invalid>
        <FieldLabel>Correo electrónico</FieldLabel>
        <Input type="email" required />
        <FieldDescription>Usaremos este correo para contactarle.</FieldDescription>
        <FieldError match>Ingrese un correo válido.</FieldError>
      </Field>,
    )

    const input = screen.getByRole("textbox", { name: "Correo electrónico" })
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAccessibleDescription("Usaremos este correo para contactarle. Ingrese un correo válido.")
  })

  it("composes card content and dialog semantics", () => {
    render(
      <>
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>Estado actual</CardDescription>
          </CardHeader>
          <CardContent>Contenido</CardContent>
        </Card>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Confirmar cambio</DialogTitle>
            <DialogDescription>Esta acción actualiza el registro.</DialogDescription>
          </DialogContent>
        </Dialog>
      </>,
    )

    expect(screen.getByText("Resumen")).toHaveClass("font-heading")
    expect(screen.getByRole("dialog", { name: "Confirmar cambio" })).toHaveAccessibleDescription("Esta acción actualiza el registro.")
    expect(screen.getByRole("button", { name: "Cerrar diálogo" })).toBeInTheDocument()
  })
})
