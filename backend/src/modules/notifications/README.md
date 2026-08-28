# Notifications

`NotificationService` owns notification semantics and template selection. The
`EmailProvider` port owns transport delivery. Phase 1 binds that port to the
in-memory `FakeEmailProvider` for tests and disabled delivery. Phase 2 adds
`GmailAppPasswordEmailProvider` as an SMTP adapter selected through module
configuration. Gmail delivery requires a Google App Password; it never uses or
stores a normal Google account password.

User-request approval delivers account activation after its database transaction
commits. A delivery failure is surfaced as a sanitized operational error and does
not activate the account, consume the token, or create another token. Durable
retry/outbox support remains pending.

For an explicit local delivery check, configure the existing email environment
variables and run `npm run email:test -- recipient@example.com`. The command
refuses to run unless Gmail delivery is selected and enabled; it is never invoked
by application startup, builds, or automated tests.
