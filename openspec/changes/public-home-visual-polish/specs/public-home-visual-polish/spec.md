## Purpose

Define visual, responsive and accessibility behavior for the public SGI-Curime Home while preserving its Curime institutional identity and all existing public interactions.

## ADDED Requirements

### Requirement: Home preserves institutional visual identity
The public Home MUST use the established ivory, deep green, maize, DM Sans and DM Serif Display visual language, with community and institutional presentation rather than generic SaaS, dashboard or technology styling.

#### Scenario: Home renders established identity
- **WHEN** a visitor opens `/`
- **THEN** the page presents existing Curime colors, approved typography and editorial/community visual tone across hero, content sections and footer

### Requirement: Home exposes clear content hierarchy
The Home MUST present, in an understandable visual order, Curime identity, available portal services, services in preparation, transparency, institutional context and private SGI access.

#### Scenario: Visitor understands portal offer
- **WHEN** a visitor scans the Home from top to bottom
- **THEN** headings, supporting text and section separation communicate who Curime is, what is available, what is pending and how to access SGI

### Requirement: Existing Home destinations remain functional
Visual changes MUST preserve all current Home destinations and their labels or equivalent accessible names, including `/nosotros`, `/servicios`, `/comunidad`, `/afiliacion`, `/transparencia`, `/eventos`, `/app/reservations/new`, `/noticias`, `/contacto`, `/login`, `/register` and conditional `/app` access.

#### Scenario: Visitor follows an available service
- **WHEN** a visitor activates a Home service CTA
- **THEN** navigation reaches the same existing destination and does not replace a future service with an interactive route

#### Scenario: Visitor uses conditional SGI access
- **WHEN** an anonymous visitor activates private access
- **THEN** navigation reaches `/login`
- **WHEN** an authenticated visitor activates private access
- **THEN** navigation reaches `/app`

### Requirement: Home distinguishes available and upcoming services
Available services MUST remain interactive with their current destinations. Volunteering and entrepreneurship MUST remain visibly marked as `Próximamente` and MUST NOT become interactive as part of this change.

#### Scenario: Visitor compares service status
- **WHEN** a visitor views the services section
- **THEN** available services have actionable affordances and future services have a distinct non-interactive pending state

### Requirement: Public shell remains keyboard and screen-reader usable
Visual refinement MUST preserve semantic heading order, one Home H1, visible focus indicators, keyboard navigation, skip link behavior, active navigation state, mobile menu ARIA state, Escape handling and focus restoration.

#### Scenario: Visitor navigates header by keyboard
- **WHEN** a visitor uses keyboard focus through header controls and links
- **THEN** every control has visible focus, menu state is exposed, and closing the mobile menu with Escape returns focus to its trigger

### Requirement: Home supports required responsive widths
The Home MUST remain readable and usable at 320px, 375px, 768px, 1024px, 1280px and 1440px or wider, without horizontal overflow, clipping, CTA collision or inaccessible touch targets.

#### Scenario: Home renders at narrow mobile width
- **WHEN** viewport width is 320px or 375px
- **THEN** hero artwork, text, CTAs, service content, navigation and footer fit the viewport without clipping or horizontal scrolling

#### Scenario: Home renders across tablet and desktop widths
- **WHEN** viewport width is 768px, 1024px, 1280px or at least 1440px
- **THEN** columns, navigation, cards, section spacing and footer use available width intentionally while preserving readable typography and balanced composition

### Requirement: Home maintains readable contrast and interaction states
Home text, links, buttons, borders and status labels MUST retain readable contrast and provide distinguishable hover, focus, active and disabled states without relying on color alone where state meaning is conveyed.

#### Scenario: Visitor interacts with Home controls
- **WHEN** a visitor hovers, focuses, activates or encounters a disabled/future service control
- **THEN** state changes remain visible, keyboard focus remains obvious, and text remains readable against its surface
