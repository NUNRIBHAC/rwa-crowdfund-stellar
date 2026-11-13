// This classic-payment demo helper is intentionally disabled. The current
// server rejects classic campaign writes; signing an API-provided envelope
// here would bypass independent wallet checks and is not a supported QA path.
// Use the current Soroban test suites and reviewed campaign-builder flow.
console.error(
  '[test-build-submit] Disabled: legacy classic build/sign/submit is unsupported. No keys are read, no network requests are made, and no transaction is signed.',
);
process.exitCode = 1;
