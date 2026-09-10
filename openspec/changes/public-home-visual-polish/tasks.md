## 1. Checkpoint 1 — Baseline visual

- [x] 1.1 Audit Home utilities against defined Tailwind tokens and replace missing public Home class names with existing institutional tokens or narrowly scoped aliases.
- [x] 1.2 Establish consistent Home section container widths, vertical rhythm, borders, radii and elevation without changing `index.css` or global breakpoints.
- [x] 1.3 Correct public logo presentation so the brand asset remains legible without vertical cropping at mobile, tablet and desktop widths.
- [x] 1.4 Manually inspect baseline at 320px, 375px, 768px, 1024px, 1280px and 1440px+ before proceeding.

## 2. Checkpoint 2 — Hero

- [x] 2.1 Refine `HeroSection` desktop grid and artwork proportions to use available width while preserving current copy and visual identity.
- [x] 2.2 Ensure hero artwork, decorative shapes and feature points do not clip at 320px or 375px.
- [x] 2.3 Establish clear primary and secondary CTA hierarchy while preserving `/nosotros` and `/servicios` destinations.
- [x] 2.4 Verify hero heading remains the single Home H1 and remains readable at all required widths.

## 3. Checkpoint 3 — Services

- [x] 3.1 Refine available-service card hierarchy, spacing, icon treatment and action affordances without changing service order or destinations.
- [x] 3.2 Balance five available service cards across tablet and desktop layouts without adding fake content.
- [x] 3.3 Visually separate `Voluntariado` and `Emprendimientos` pending cards and retain non-interactive `Próximamente` states.
- [x] 3.4 Confirm `Reservas` still targets `/app/reservations/new` and no future service becomes a link.

## 4. Checkpoint 4 — PublicHeader

- [x] 4.1 Improve desktop navigation legibility and spacing between 1024px and 1439px without changing `site.nav` destinations.
- [x] 4.2 Preserve active `NavLink` state, accessible names, target sizes and visible focus treatment.
- [x] 4.3 Preserve mobile menu open/close behavior, `aria-expanded`, `aria-controls`, Escape handling and focus restoration.
- [x] 4.4 Verify anonymous access remains `/login` and authenticated access remains `/app` in header.

## 5. Checkpoint 5 — Institutional sections

- [x] 5.1 Refine `TransparencySection` proportion, contrast, CTA hierarchy and spacing while preserving `/transparencia`.
- [x] 5.2 Refine `AboutSection` reading width, tablet transition, divider treatment and secondary-text contrast while preserving content and `/nosotros`.
- [x] 5.3 Refine private-access section continuity while preserving anonymous `/login` and authenticated `/app` behavior.
- [x] 5.4 Review section transitions so ivory, deep green and maize remain coherent and institutional.

## 6. Checkpoint 6 — Footer and responsive pass

- [x] 6.1 Improve `PublicFooter` layout at 320px and 375px, including readable quick links and natural email wrapping.
- [x] 6.2 Preserve footer email, Instagram, Facebook, quick-link destinations and conditional system access.
- [x] 6.3 Preserve or refine the institutional wave without introducing clipping or excessive visual weight.
- [x] 6.4 Verify no horizontal overflow, CTA collision, inaccessible target or clipped content at all required widths and at 200% zoom.
- [x] 6.5 Verify hover, focus, active, disabled and pending states retain readable contrast and distinguishable feedback.

## 7. Checkpoint 7 — Validation

- [x] 7.1 Extend focused public Home tests only where needed to protect heading hierarchy, Home destinations, pending-service non-interactivity and conditional access. No extension required: this change is presentational and preserves the existing interaction contracts.
- [x] 7.2 Daniel manually verifies keyboard navigation, skip link, mobile menu, Escape and focus restoration.
- [x] 7.3 Daniel manually verifies `/`, `/nosotros`, `/servicios`, `/comunidad`, `/afiliacion`, `/transparencia`, `/eventos`, `/contacto`, `/noticias`, `/login`, `/register` and protected reservation navigation remain functional.
- [x] 7.4 Daniel runs focused tests for public Home and related public features.
- [x] 7.5 Daniel runs `npm run verify` after manual review; implementation workflow must not run test suites automatically.
