# Inventory dashboard

## ADDED Requirements

### Requirement: Show operational inventory indicators

The dashboard MUST show total items, low-stock items, active loans, and overdue loans from the inventory summary response. It MUST identify attention states without fabricating values.

#### Scenario: Summary loaded

- **WHEN** `GET /inventory/reports/summary` resolves
- **THEN** the dashboard renders the four operational indicators and supporting real counts

#### Scenario: Summary unavailable

- **WHEN** the summary request fails
- **THEN** the dashboard renders the existing accessible error state and does not present placeholder metrics

### Requirement: Visualize available report aggregates

The dashboard MUST visualize category distribution from returned stock rows, loan status from the loan report, and movement activity from the movement report. Each visualization MUST include an equivalent textual list, legend, or supporting explanation.

#### Scenario: Report aggregate exists

- **WHEN** a report response contains rows or aggregate counts
- **THEN** the matching chart renders with labels, tooltip support, and the real values

#### Scenario: Report aggregate is empty

- **WHEN** a report contains no usable rows or all loan statuses are zero
- **THEN** the matching section renders an explicit empty state

### Requirement: Surface operational attention

The dashboard MUST show current low/out-of-stock items and overdue loans when alert data is available, with links to the existing alert route.

#### Scenario: Attention data exists

- **WHEN** alert data contains stock or overdue loan records
- **THEN** the center of attention lists a compact subset and links to `/inventory/alerts`

### Requirement: Preserve resilient responsive behavior

The dashboard MUST preserve `inv.inventory.read`, existing routes, shared tokens and accessible loading/error states. Auxiliary request failures MUST NOT erase a successfully loaded summary.

#### Scenario: Sidebar-constrained layout

- **WHEN** content width changes because the ERP sidebar expands, collapses, or the viewport narrows
- **THEN** cards and charts shrink/reflow without forcing page-level horizontal overflow
