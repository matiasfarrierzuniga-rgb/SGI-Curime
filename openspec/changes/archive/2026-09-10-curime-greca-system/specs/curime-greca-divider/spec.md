## Purpose

Definir Curime Greca System: tres decoraciones SVG reutilizables para secciones específicas de la Home pública, preservando comportamiento, accesibilidad y composición responsive existentes.

## ADDED Requirements

### Requirement: CurimeGrecaSystem preserves official brand fidelity

The system MUST provide `CurimeGrecaDivider`, `CurimeGrecaPattern` and `CurimeBrandAccent` as presentational, domain-neutral components using approved partial CURIME geometry. Motifs MUST NOT reproduce the complete logo, seal, profile, or official mark composition.

#### Scenario: Motifs are reviewed against official identity

- **WHEN** an SVG motif is compared with approved CURIME assets
- **THEN** its rhythm, geometry and color treatment are recognizably consistent without functioning as a logo replacement

### Requirement: Divider marks Hero-to-Services transition

`ServicesSection` MUST consume `CurimeGrecaDivider` at its upper transition, replacing the generic sage divider with a fluid, low-height decoration.

#### Scenario: Visitor scans Hero into Services

- **WHEN** a visitor moves from Hero to Services
- **THEN** one restrained divider marks the transition without changing section content, order, spacing contract, heading hierarchy or CTA behavior

### Requirement: Pattern is limited to TransparencySection

`TransparencySection` MUST consume `CurimeGrecaPattern` once as a tonal, low-intensity decoration on the deep-green surface. It MUST replace the previous sage ring and remain behind content.

#### Scenario: Visitor reads transparency content

- **WHEN** a visitor views TransparencySection
- **THEN** the Pattern supports institutional identity without competing with its heading, text or CTA

### Requirement: Brand accent is limited to AboutSection

`AboutSection` MUST consume `CurimeBrandAccent` once as a low-opacity, out-of-flow decoration. It MUST be hidden before `md` and MUST NOT cover or displace content.

#### Scenario: Visitor views AboutSection

- **WHEN** a visitor views AboutSection at desktop width
- **THEN** one secondary accent reinforces identity without competing with heading, text, link or CTA

### Requirement: Decorative motifs remain accessible and responsive

Each motif MUST be `aria-hidden`, have no text, focus target or interaction, and use `pointer-events-none`. The system MUST support 320px, 375px, 768px, 1024px, 1280px and 1440px+ without horizontal overflow, significant layout displacement or content collision.

#### Scenario: Visitor uses the Home at narrow width

- **WHEN** the Home renders at 320px or 375px
- **THEN** decorative motifs remain secondary, stay within controlled clipping, and do not obscure interactive or semantic content

### Requirement: Functional public behavior is preserved

The system MUST use no gradients, motion, runtime dependencies, additional pages, card decorations or functional iconography. It MUST preserve Home content, navigation, auth-dependent access, routes, CTAs, state, capabilities, landmarks, headings, skip-link and focus-visible behavior.

#### Scenario: Visitor uses existing Services controls

- **WHEN** a visitor activates any existing Services CTA
- **THEN** it reaches the same destination and the decorative divider has no effect on interaction
