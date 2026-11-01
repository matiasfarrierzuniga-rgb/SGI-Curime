# Calendar experience

## ADDED Requirements

### Requirement: Institutional agenda views

The event management route SHALL present month, week, day and list views from real scheduled, non-archived administrative event records. View changes SHALL NOT mutate event data.

#### Scenario: Scheduled events load

- **WHEN** event data includes scheduled records
- **THEN** each agenda view represents those records with date, title and location when available

#### Scenario: No scheduled event exists

- **WHEN** no loaded event is eligible for the agenda
- **THEN** the agenda shows an explicit empty state

### Requirement: Dashboard calendar consultation

The administrative dashboard SHALL keep its compact capability-filtered calendar and SHALL open an expanded read-only calendar consultation when a day is selected. The consultation SHALL offer month, week, day and agenda views of currently loaded authorized activity sources.

#### Scenario: Authorized activity date is selected

- **WHEN** a user selects a day in the dashboard calendar
- **THEN** the expanded consultation shows real loaded activities for that date without mutating records or revealing unavailable modules

### Requirement: Calendar contextual composition

The events route SHALL provide a selected-date panel adjacent to the calendar on desktop and stacked on smaller screens. Selecting a day SHALL show its real chronological scheduled events or a compact empty state. The reservation route SHALL expose one visible range capture surface and SHALL keep occupancy limited to loaded records.

#### Scenario: Empty selected event date

- **WHEN** a user selects a date without a scheduled event
- **THEN** the contextual panel identifies the date and explains that no activity is registered

### Requirement: Reservation occupancy preserves conflict authority

The reservation administration route SHALL show occupancy only from real active rows it has loaded and SHALL direct users to the existing request flow for availability validation.

#### Scenario: A loaded active reservation overlaps a calendar day

- **WHEN** the current result page contains a non-rejected, non-cancelled reservation
- **THEN** its resource is identified in that day cell

#### Scenario: A day has no loaded reservation

- **WHEN** no loaded row begins that day
- **THEN** the interface SHALL NOT claim that the resource is available

### Requirement: Shared date range capture

The shared DateRangePicker SHALL present one controlled continuous range surface, preserve ISO `YYYY-MM-DD` values and constrain end selection to dates on or after a selected start date.

#### Scenario: User selects a start date

- **WHEN** the start date is set
- **THEN** earlier dates are unavailable in the end picker

#### Scenario: Public reservation captures dates and hours

- **WHEN** a requester selects a range in the public reservation form
- **THEN** existing date-time values retain their selected or default times and backend availability remains the authority
