# Spec Delta

## Purpose

Define una presentación pública de eventos que permita a la comunidad encontrar rápidamente fechas, lugares y contenido relevante, manteniendo una experiencia institucional, accesible y usable en distintos tamaños de pantalla.

## ADDED Requirements

### Requirement: Event listing prioritizes scannable information

The public events listing SHALL present the page title, introductory context, event status, title, summary, date/time, location when available, and a visible path to the event detail in a clear reading order.

#### Scenario: User scans published events

- **WHEN** a visitor opens the public events page with published events
- **THEN** each event exposes its status, title, summary, date/time, optional location, and detail action without requiring an additional interaction

#### Scenario: No events are published

- **WHEN** the public events response contains no events
- **THEN** the page presents a clear empty state explaining that the agenda has no published activities

### Requirement: Event cards maintain balanced visual hierarchy

The public events listing SHALL use consistent grouping and spacing so that event metadata and the detail action remain visually associated with their event without excessive empty vertical space.

#### Scenario: Events have different summary lengths

- **WHEN** published events contain summaries of different lengths
- **THEN** each event remains readable, the primary information keeps consistent priority, and the detail action remains discoverable

### Requirement: Event detail separates content and metadata

The public event detail SHALL distinguish the event title and summary from status, date/time, location, and longer description while keeping these elements within one coherent reading flow.

#### Scenario: User opens an available event

- **WHEN** a visitor opens a published event detail
- **THEN** the page presents the event title, status, summary, date/time, optional location, and description when available in a clearly differentiated order

#### Scenario: Event has no optional content

- **WHEN** an event has no location or description
- **THEN** the detail omits unavailable sections without leaving misleading labels or empty visual blocks

### Requirement: Listing and detail navigation remain discoverable

The public event experience SHALL provide an accessible, visible way to return from an event detail to the public events listing without changing the existing route relationship.

#### Scenario: Visitor returns to the agenda

- **WHEN** a visitor is viewing an event detail
- **THEN** a keyboard- and pointer-accessible return action navigates to the public events listing

### Requirement: Event presentation adapts across supported widths

The public event listing and detail SHALL remain readable and usable at 320, 375, 768, 1024, and 1440 pixels without page-level horizontal overflow or loss of essential information.

#### Scenario: Visitor uses a narrow mobile viewport

- **WHEN** the page is viewed at 320 or 375 pixels wide
- **THEN** content is presented in a single readable flow, controls remain usable, and no essential text or action is clipped

#### Scenario: Visitor uses tablet or desktop viewport

- **WHEN** the page is viewed at 768, 1024, or 1440 pixels wide
- **THEN** the layout uses available width intentionally, preserves readable text measure, and keeps event hierarchy and navigation visible

### Requirement: Existing data and request states remain truthful

The public event pages SHALL preserve the meaning of existing published event data and visibly represent loading, error, empty, available, and past-event states without inventing content or metrics.

#### Scenario: Event data is loading or unavailable

- **WHEN** the event query is pending or fails
- **THEN** the page presents the existing loading or error meaning and an appropriate recovery path without rendering fabricated event content

#### Scenario: Event is in the past

- **WHEN** an event's presentation identifies it as past
- **THEN** the page communicates that state distinctly from scheduled events while retaining the event's authoritative status
