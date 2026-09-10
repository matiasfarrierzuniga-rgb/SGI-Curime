## 1. Phase 1 — CurimeGrecaDivider

- [x] 1.1 Confirm approved CURIME source geometry and document that the full logo, seal and official marks must not be reproduced.
- [x] 1.2 Create `frontend/public/brand/motifs/greca-horizontal.svg` as the only Phase 1 brand asset, using a stable horizontal viewBox, restrained geometry and token-compatible color strategy.
- [x] 1.3 Create `frontend/src/shared/ui/brand/CurimeGrecaDivider.tsx` as a presentational decorative SVG wrapper with `aria-hidden`, no interaction, no motion and fluid sizing.
- [x] 1.4 Replace or visually subordinate the generic sage divider at the top of `ServicesSection` without changing content, layout, spacing, headings, cards or CTAs.
- [x] 1.5 Confirm Phase 1 does not introduce `CurimeGrecaPattern`, `CurimeBrandAccent`, future assets, legacy folders or dependencies.

## 2. System validation

- [x] 2.1 Manually inspect all three initial integrations at 320px, 375px, 768px, 1024px, 1280px and 1440px+.
- [x] 2.2 Confirm no horizontal overflow, clipping, significant layout shift, heading competition or CTA collision.
- [x] 2.3 Confirm decorative semantics, keyboard behavior, focus-visible behavior, landmarks, skip-link and touch targets are unchanged.
- [x] 2.4 Confirm Divider, Pattern and Accent use existing identity colors and no gradients, motion or new tokens.

## 3. Daniel validation

- [x] 3.1 Daniel ran `PublicPages.test.tsx`: 18/18 PASS.
- [x] 3.2 Architecture validation passed through `npm run verify`.
- [x] 3.3 Build and `npm run verify` passed: 65/65 test files and 402/402 tests.
- [x] 3.4 Daniel approved final responsive and visual review for all three phases.

## 4. Phase 2 — CurimeGrecaPattern

- [x] 4.1 Create `CurimeGrecaPattern` and `greca-pattern.svg` for one restrained, decorative use in `TransparencySection`, replacing the competing sage ring.

## 5. Phase 3 — CurimeBrandAccent

- [x] 5.1 Create `CurimeBrandAccent` and `maize-mark.svg` for one restrained, decorative use in `AboutSection`.
