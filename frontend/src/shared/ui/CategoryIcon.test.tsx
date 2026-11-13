import { CalendarDays, Heart, UsersRound } from "lucide-react"
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
})
