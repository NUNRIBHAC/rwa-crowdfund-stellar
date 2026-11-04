# Non-binding fixture meetings

The prototype can save a fictitious meeting and collect one recorded choice from each fixed fixture account. This is an isolated participation rehearsal, not an exercise of investor rights.

- An organizer creates a draft with a fixed resolution and participant list. Participants must already have fixture accounts. Duplicate participants and extra input fields fail.
- The organizer opens the meeting, then closes it. Drafts can instead be cancelled. Closed and cancelled meetings cannot reopen.
- Each listed account may record `for`, `against` or `abstain` while open. The same retry returns its existing choice. A changed choice fails. No share weighting, quorum, pass threshold or legal result is invented.
- Participant responses show their own choice, never anyone else's ballot or identifier. Interim totals are withheld from participants; closed totals count fixture accounts only. The organizer gets the audit trail.
- Creation and participation persist through the existing store abstraction. They are stored separately from real applications, assessments, journals, notifications and holdings. No messages or invitations are sent.
- Every response says `simulation: true`, `binding: false`, `legalEffect: false`. A fixture account is not proof of a real person or independent voter.

The optional local HTTP router uses existing authenticated account sessions. Organizers are checked against an injected allowlist on every action; request bodies cannot select the acting account. It is not mounted in `server.ts`. Tests create an isolated store and fresh local fixture sessions, never hosted users or records.

```sh
node --import tsx --test backend/test/meeting-simulation.test.ts backend/test/meeting-simulation-routes.test.ts
```

Unfinished: hosted/UI integration, verified issuer authority, record-date entitlement snapshots, lawful participation and quorum rules, privacy/retention policy, meeting notice delivery, proxy arrangements, approved resolutions, signatures and any legally effective action. No jurisdictional compliance or production-readiness claim is made.
