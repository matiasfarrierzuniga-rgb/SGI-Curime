import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const legacyCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

describe("legacy CSS cascade contract", () => {
  it("places generic legacy selectors in Tailwind's base layer", () => {
    expect(legacyCss).toContain("@layer base {")
    expect(legacyCss).toMatch(/button \{ padding: \.6rem \.9rem; border: 1px solid transparent;/)
    expect(legacyCss).toMatch(/input, select, textarea \{ width: 100%; padding: \.65rem; border: 1px solid var\(--color-border-default\);/)
    expect(legacyCss).toMatch(/th \{ background: var\(--color-background-subtle\);/)
    expect(legacyCss).not.toContain('.modal-overlay { position: fixed;')
  })

  it("does not replace Tailwind's semantic muted surface token", () => {
    expect(legacyCss).toContain("--legacy-color-muted: var(--color-text-secondary);")
    expect(legacyCss).not.toContain("--color-muted: var(--color-text-secondary);")
  })
})
