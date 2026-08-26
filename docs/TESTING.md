# Testing

`npm run verify` is the release verification command. It runs strict TypeScript checks, the core calculation tests, web workflow tests, mobile component workflow tests, and the web production build.

## Coverage by layer

- Core tests cover currency parsing, equal and itemized calculations, deterministic remainder allocation, proportional tax and tip, conservation, safe-integer limits, duplicate identifiers, and persisted-draft validation.
- Web tests exercise the user workflows through the Vue component, including local draft storage, equal and itemized results, and reset confirmation.
- Mobile tests exercise the React Native component through the test host, including calculation and persisted-draft restoration.

Native tests use React Test Renderer for deterministic component coverage. A real emulator or device run is a separate environment check and should be reported independently from automated tests.

For visual QA, run the web shell and check both a desktop-sized viewport and a narrow phone-sized viewport. Confirm that the input flow, error states, reset confirmation, result reconciliation, and responsive layout remain usable.
