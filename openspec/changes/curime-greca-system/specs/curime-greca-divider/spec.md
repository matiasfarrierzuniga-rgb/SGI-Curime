## Purpose

Definir un divider decorativo CURIME reutilizable para la transición Hero -> Services de la Home pública, preservando comportamiento, accesibilidad y composición responsive existentes.

## ADDED Requirements

### Requirement: CurimeGrecaDivider is reusable and decorative

The system MUST provide `frontend/src/shared/ui/brand/CurimeGrecaDivider.tsx` as a presentational, domain-neutral component using the approved horizontal CURIME motif.

#### Scenario: Divider renders without semantic content

- **WHEN** `CurimeGrecaDivider` is rendered
- **THEN** it presents a fluid, low-height SVG decoration with no text, no focus target, no interaction, and `aria-hidden="true"`

### Requirement: Motif preserves official brand fidelity

The motif MUST derive only partial geometry from approved CURIME identity assets and MUST NOT reproduce the complete logo, seal, profile, or official mark composition.

#### Scenario: Motif is reviewed against official identity

- **WHEN** the SVG is compared with approved CURIME assets
- **THEN** its rhythm, geometry and color treatment are recognizably consistent without functioning as a logo replacement

### Requirement: Home uses divider at Hero-to-Services transition

`ServicesSection` MUST consume `CurimeGrecaDivider` at its upper transition, replacing or visually subordinating the existing generic sage divider.

#### Scenario: Visitor scans Hero into Services

- **WHEN** a visitor moves from Hero to Services
- **THEN** one restrained CURIME divider marks the transition without changing section content, order, spacing contract, heading hierarchy or CTA behavior

### Requirement: Divider remains responsive

The divider MUST support 320px, 375px, 768px, 1024px, 1280px and 1440px+ without horizontal overflow, clipping that harms the motif, or significant content displacement.

#### Scenario: Narrow viewport renders transition

- **WHEN** the Home is rendered at 320px or 375px
- **THEN** the divider remains inside the viewport, keeps small visual height and does not collide with or obscure content

### Requirement: Phase 1 limits visual repetition

Phase 1 MUST use no more than one primary greca treatment in the affected section and MUST NOT add Pattern or BrandAccent components or assets.

#### Scenario: Future motifs remain deferred

- **WHEN** Phase 1 is reviewed
- **THEN** `CurimeGrecaPattern` and `CurimeBrandAccent` are absent from implementation and remain documented as future phases

### Requirement: Functional public behavior is preserved

The change MUST preserve Home content, navigation, auth-dependent access, routes, CTAs, state, capabilities, landmarks, headings, skip-link and focus-visible behavior.

#### Scenario: Visitor uses existing Services controls

- **WHEN** a visitor activates any existing Services CTA
- **THEN** it reaches the same destination and the decorative divider has no effect on interaction
