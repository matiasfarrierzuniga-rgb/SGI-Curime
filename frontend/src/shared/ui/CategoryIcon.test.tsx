import { CalendarDays, Heart, Newspaper, UsersRound } from "lucide-react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CategoryIcon } from "./CategoryIcon"

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

  it("uses the public semantic tokens for institutional and public categories", () => {
    render(
      <>
        <CategoryIcon icon={UsersRound} tone="institutional" data-testid="institutional" />
        <CategoryIcon icon={UsersRound} tone="entrepreneurship" data-testid="entrepreneurship" />
        <CategoryIcon icon={Heart} tone="volunteering" data-testid="volunteering" />
        <CategoryIcon icon={Newspaper} tone="news" data-testid="news" />
        <CategoryIcon icon={Newspaper} tone="transparency" data-testid="transparency" />
        <CategoryIcon icon={Newspaper} tone="contact" data-testid="contact" />
      </>,
    )

    expect(screen.getByTestId("institutional")).toHaveClass("bg-public-icon-institutional-surface", "text-public-icon-institutional")
    expect(screen.getByTestId("entrepreneurship")).toHaveClass("bg-public-icon-entrepreneurship-surface", "text-public-icon-entrepreneurship")
    expect(screen.getByTestId("volunteering")).toHaveClass("bg-public-icon-volunteering-surface", "text-public-icon-volunteering")
    expect(screen.getByTestId("news")).toHaveClass("bg-public-icon-news-surface", "text-public-icon-news")
    expect(screen.getByTestId("transparency")).toHaveClass("bg-public-icon-transparency-surface", "text-public-icon-transparency")
    expect(screen.getByTestId("contact")).toHaveClass("bg-public-icon-contact-surface", "text-public-icon-contact")
  })

  it("supports the compact, default and large size scales for its decorative glyph", () => {
    render(
      <>
        <CategoryIcon icon={UsersRound} size="sm" data-testid="small" />
        <CategoryIcon icon={UsersRound} data-testid="default" />
        <CategoryIcon icon={UsersRound} size="lg" data-testid="large" />
      </>,
    )

    expect(screen.getByTestId("small")).toHaveClass("size-9")
    expect(screen.getByTestId("small").querySelector("svg")).toHaveClass("size-4")
    expect(screen.getByTestId("default")).toHaveClass("size-10")
    expect(screen.getByTestId("default").querySelector("svg")).toHaveClass("size-5")
    expect(screen.getByTestId("large")).toHaveClass("size-12")
    expect(screen.getByTestId("large").querySelector("svg")).toHaveClass("size-6")
    expect(screen.getByTestId("default").querySelector("svg")).toHaveAttribute("stroke-width", "1.75")
    expect(screen.getByTestId("default").querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })
})
