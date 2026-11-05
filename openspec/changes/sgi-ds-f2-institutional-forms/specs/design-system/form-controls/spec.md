# Spec Delta

## Purpose

Esta capacidad establece controles de formulario compartidos, accesibles y consistentes para que las verticales institucionales capturen datos con el mismo contrato visual, semántico y de validación.

## ADDED Requirements

### Requirement: Form fields expose an accessible contract

`FormField` MUST associate its visible label with one control and MUST expose description and validation error text through the control's accessible description when present.

#### Scenario: Field with description and error

- **WHEN** a field renders label, description and error
- **THEN** the control has the field id, `aria-invalid="true"`, and references both description and error text

#### Scenario: Required field

- **WHEN** a field is marked required
- **THEN** the visible label communicates required status and an assistive technology receives an equivalent required indication

### Requirement: Shared controls preserve interaction states

`Input` and `Select` MUST provide the institutional control size, visible keyboard focus, disabled treatment and invalid treatment through the shared token contract without requiring page-specific base classes.

#### Scenario: Keyboard focus

- **WHEN** a user focuses an enabled input or select with the keyboard
- **THEN** a visible focus indicator appears without removing the control's accessible name

#### Scenario: Disabled or invalid control

- **WHEN** a control is disabled or marked invalid
- **THEN** it exposes the corresponding semantic state and prevents interaction while retaining readable contrast

### Requirement: Institutional profile validation is schema-driven

The Perfil institucional edit flow MUST validate form values before submission and MUST preserve current normalization, optional fields as `null`, four-step navigation, single-submit behavior and server error handling.

#### Scenario: Invalid email

- **WHEN** an administrator submits an invalid institutional email
- **THEN** an accessible field error is shown and no update request is sent

#### Scenario: Valid optional profile

- **WHEN** an authorized administrator submits valid values with blank optional fields
- **THEN** one update request is sent with normalized values and blank optional fields represented as `null`

#### Scenario: API failure

- **WHEN** the update request fails
- **THEN** the form preserves entered values, exposes an accessible error and remains available for retry

### Requirement: Shared form behavior is regression-tested

The change MUST provide focused automated coverage for shared control semantics and the Perfil institucional success, validation, loading and failure states.

#### Scenario: Permission-restricted profile

- **WHEN** a session lacks `adm.institutional-profile.update`
- **THEN** the profile remains readable and edit controls are not exposed

#### Scenario: Focused verification

- **WHEN** the focused frontend tests and architecture check run
- **THEN** the shared controls and profile feature pass without introducing imports that violate `app -> features -> shared`
