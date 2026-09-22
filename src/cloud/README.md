# Cloud boundary

This folder is reserved for future server-authorized cloud features. Planned boundaries:

- `AuthService` — optional sign-in session coordination
- `SyncManager` — local queue processing and retry policy
- `CloudProjectRepository` — remote project persistence behind an interface
- `ConflictManager` — deterministic conflict detection and resolution

No provider SDK, credentials, authentication, or network behavior belongs in the current foundation.
