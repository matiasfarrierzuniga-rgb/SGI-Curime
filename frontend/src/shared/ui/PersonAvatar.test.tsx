import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PersonAvatar } from "./PersonAvatar"

describe("PersonAvatar", () => {
  it("renders two initials with institutional circular avatar styling", () => {
    render(<PersonAvatar name="María del Carmen" />)

    const avatar = screen.getByText("MD").closest("span")
    expect(avatar).toHaveClass("size-10", "rounded-full", "bg-status-success-surface", "text-status-success")
    expect(avatar).toHaveAttribute("aria-hidden", "true")
  })

  it("uses a stable fallback for missing names", () => {
    render(<PersonAvatar name={null} />)

    expect(screen.getByText("SR")).toBeInTheDocument()
  })
})
