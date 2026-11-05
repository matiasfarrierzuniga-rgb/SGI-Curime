import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Pagination } from "./Pagination"

describe("Pagination", () => {
  it("uses the shared outline Button contract and changes only available pages", () => {
    const onChange = vi.fn()

    render(<Pagination page={2} total={30} limit={10} onChange={onChange} />)

    const previous = screen.getByRole("button", { name: "Anterior" })
    const next = screen.getByRole("button", { name: "Siguiente" })

    expect(previous).toHaveClass("border-primary", "bg-transparent", "text-primary", "h-9")
    expect(next).toHaveClass("border-primary", "bg-transparent", "text-primary", "h-9")

    fireEvent.click(previous)
    fireEvent.click(next)

    expect(onChange).toHaveBeenNthCalledWith(1, 1)
    expect(onChange).toHaveBeenNthCalledWith(2, 3)
  })

  it("keeps disabled pagination controls on the shared Button contract", () => {
    render(<Pagination page={1} total={10} limit={10} onChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled()
  })
})
