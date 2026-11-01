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

### Requirement: Reservation occupancy preserves conflict authority

The reservation administration route SHALL show occupancy only from real active rows it has loaded and SHALL direct users to the existing request flow for availability validation.

#### Scenario: A loaded active reservation overlaps a calendar day

- **WHEN** the current result page contains a non-rejected, non-cancelled reservation
- **THEN** its resource is identified in that day cell

#### Scenario: A day has no loaded reservation

- **WHEN** no loaded row begins that day
- **THEN** the interface SHALL NOT claim that the resource is available

### Requirement: Shared date range capture

The shared DateRangePicker SHALL compose two controlled DatePicker fields, preserve ISO `YYYY-MM-DD` values and constrain end selection to dates on or after a selected start date.

#### Scenario: User selects a start date

- **WHEN** the start date is set
- **THEN** earlier dates are unavailable in the end picker
