# Splitlery

Split the check. Not the table.

Splitlery is a small receipt-splitting utility for quickly calculating what everyone owes. Version 1 supports two focused workflows:

- Equal Split divides a subtotal, receipt tax, and subtotal-based tip across a group with deterministic cent remainder allocation.
- Itemized Split assigns individual or shared items to people, then allocates the receipt tax and tip proportionally to each person’s pretax share.

The calculation engine lives in `packages/core` as framework-independent TypeScript. The responsive Vue 3 web app is in `apps/web`, and the Expo React Native app is in `apps/mobile`. Both applications consume the same integer-cent calculation engine and persist only the active draft locally (`localStorage` on web and AsyncStorage on mobile).

No account, backend, cloud sync, receipt history, analytics, telemetry, tracking, or receipt data transmission is part of Version 1. Receipt data stays on the device where the app is used.

## Quick start

```bash
npm install
npm run verify
```

`npm run verify` runs strict TypeScript checks, core regression tests, web workflow tests, React Native component workflow tests, and the web production build.

Run the web app with `npm run dev --workspace @splitlery/web` and the native app with `npm run start --workspace @splitlery/mobile` in an Expo-supported environment.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Calculation rules](docs/CALCULATIONS.md)
- [Development](docs/DEVELOPMENT.md)
- [Testing](docs/TESTING.md)

## License

Splitlery is available under the [MIT License](LICENSE).
