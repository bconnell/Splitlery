# Architecture

Splitlery is a local-first monorepo with one calculation engine and two platform shells.

## Boundaries

- `packages/core` contains receipt contracts, validation, integer-cent arithmetic, deterministic allocation, formatting, and persistence parsing.
- `apps/web` contains the Vue user interface and a `localStorage` adapter.
- `apps/mobile` contains the Expo React Native user interface and an AsyncStorage adapter.

The applications do not duplicate calculation rules. Each builds a platform-specific draft, passes it to `@splitlery/core`, and renders the returned summary.

## Data flow

1. The user edits an equal or itemized draft in the platform shell.
2. Currency strings are parsed into integer cents at the boundary.
3. The core validates the draft and calculates a complete summary.
4. The shell renders per-person shares and a reconciliation line.
5. The active draft is serialized locally on the same device.

There is no server, account, analytics pipeline, receipt history, or cross-device synchronization in V1.
