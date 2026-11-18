import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SocialIcon } from "./SocialIcon"

describe("SocialIcon", () => {
  it("renders a decorative monochrome Instagram glyph that inherits the surrounding color", () => {
    const { container } = render(<SocialIcon platform="instagram" className="size-4" />)
    const svg = container.querySelector("svg")

    expect(svg).toHaveAttribute("aria-hidden", "true")
    expect(svg).toHaveAttribute("focusable", "false")
    expect(svg).toHaveAttribute("fill", "none")
    expect(svg).toHaveAttribute("stroke", "currentColor")
    expect(svg).toHaveAttribute("stroke-width", "1.75")
    expect(svg).toHaveClass("size-4", "shrink-0")
  })

  it("renders the Facebook mark as a filled glyph that inherits the surrounding color", () => {
    const { container } = render(<SocialIcon platform="facebook" className="size-4" />)
    const svg = container.querySelector("svg")

    expect(svg).toHaveAttribute("aria-hidden", "true")
    expect(svg).toHaveAttribute("focusable", "false")
    expect(svg).toHaveClass("fill-current", "size-4", "shrink-0")
    expect(svg?.querySelector("path")).toHaveAttribute("d")
  })
})
