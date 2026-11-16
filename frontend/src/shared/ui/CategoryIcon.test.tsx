import { CalendarDays, Heart, UsersRound } from "lucide-react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CategoryIcon } from "./CategoryIcon"
import { publicCategories } from "./publicCategories"

describe("CategoryIcon", () => {
  it("maps functional categories to shared semantic colors", () => {
    render(
      <>
        <CategoryIcon icon={UsersRound} tone="affiliates" data-testid="affiliates" />
        <CategoryIcon icon={CalendarDays} tone="reservations" data-testid="reservations" />
        <CategoryIcon icon={CalendarDays} tone="events" data-testid="events" />
        <CategoryIcon icon={Heart} tone="donations" data-testid="donations" />
      </>,
    )

    expect(screen.getByTestId("affiliates")).toHaveClass("bg-status-success-surface", "text-status-success")
    expect(screen.getByTestId("reservations")).toHaveClass("bg-status-info-surface", "text-status-info")
    expect(screen.getByTestId("events")).toHaveClass("bg-status-warning-surface", "text-status-warning")
    expect(screen.getByTestId("donations")).toHaveClass("bg-status-danger-surface", "text-status-danger")
  })

  it("uses dedicated public-site tokens for the new categories", () => {
    render(
      <>
        <CategoryIcon icon={Heart} tone="entrepreneurship" data-testid="entrepreneurship" />
        <CategoryIcon icon={Heart} tone="volunteering" data-testid="volunteering" />
        <CategoryIcon icon={Heart} tone="news" data-testid="news" />
        <CategoryIcon icon={Heart} tone="transparency" data-testid="transparency" />
        <CategoryIcon icon={Heart} tone="contact" data-testid="contact" />
        <CategoryIcon icon={Heart} tone="institutional" data-testid="institutional" />
      </>,
    )

    expect(screen.getByTestId("entrepreneurship")).toHaveClass(
      "bg-public-icon-entrepreneurship-surface",
      "text-public-icon-entrepreneurship",
    )
    expect(screen.getByTestId("volunteering")).toHaveClass(
      "bg-public-icon-volunteering-surface",
      "text-public-icon-volunteering",
    )
    expect(screen.getByTestId("news")).toHaveClass("bg-public-icon-news-surface", "text-public-icon-news")
    expect(screen.getByTestId("transparency")).toHaveClass(
      "bg-public-icon-transparency-surface",
      "text-public-icon-transparency",
    )
    expect(screen.getByTestId("contact")).toHaveClass("bg-public-icon-contact-surface", "text-public-icon-contact")
    expect(screen.getByTestId("institutional")).toHaveClass(
      "bg-public-icon-institutional-surface",
      "text-public-icon-institutional",
    )
  })

  it("keeps md as the compatible default and exposes the three-size scale", () => {
    render(
      <>
        <CategoryIcon icon={Heart} data-testid="default" />
        <CategoryIcon icon={Heart} size="sm" data-testid="sm" />
        <CategoryIcon icon={Heart} size="md" data-testid="md" />
        <CategoryIcon icon={Heart} size="lg" data-testid="lg" />
      </>,
    )

    expect(screen.getByTestId("default")).toHaveClass("size-10")
    expect(screen.getByTestId("sm")).toHaveClass("size-9")
    expect(screen.getByTestId("md")).toHaveClass("size-10")
    expect(screen.getByTestId("lg")).toHaveClass("size-12")
    for (const id of ["default", "sm", "md", "lg"]) {
      expect(screen.getByTestId(id)).toHaveClass("rounded-control")
    }
  })

  it("renders the glyph as decorative with a consistent stroke width", () => {
    const { container } = render(<CategoryIcon icon={Heart} data-testid="icon" />)
    const svg = container.querySelector("svg")

    expect(svg).toHaveAttribute("aria-hidden", "true")
    expect(svg).toHaveAttribute("stroke-width", "1.75")
  })

  it("exposes one icon and tone per public category", () => {
    const expectedTones = {
      affiliation: "affiliates",
      reservations: "reservations",
      events: "events",
      entrepreneurship: "entrepreneurship",
      volunteering: "volunteering",
      donations: "donations",
      news: "news",
      transparency: "transparency",
      contact: "contact",
    } as const

    for (const [key, tone] of Object.entries(expectedTones)) {
      const category = publicCategories[key as keyof typeof publicCategories]
      expect(category.tone).toBe(tone)
      expect(category.icon).toBeTruthy()
      expect(category.label.length).toBeGreaterThan(0)
    }
  })
})
