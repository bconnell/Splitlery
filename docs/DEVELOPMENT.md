# Development

## Prerequisites

- Node.js and npm
- An Expo-supported Android or iOS development environment for native runs

Splitlery does not require a backend or service credentials for V1.

## Install and verify

```bash
npm install
npm run verify
```

Useful focused commands:

```bash
npm run test:core
npm run test:web
npm run test:mobile
npm run typecheck
npm run build
```

Start the web shell with:

```bash
npm run dev --workspace @splitlery/web
```

Start the Expo shell with:

```bash
npm run start --workspace @splitlery/mobile
```

The mobile shell expects the developer’s existing Expo and platform tooling. No SDK or emulator paths are hard-coded in the project.
