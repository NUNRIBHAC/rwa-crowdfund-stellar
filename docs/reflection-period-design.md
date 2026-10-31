# Reflection period - design preparation (not implemented)

Status: **design notes only**. Nothing here is built, deployed or authorized.
Implementing any variant requires (a) an explicit owner decision and
(b) legal review of the investor-categorisation criteria it depends on.
No contract behavior changes without a separate explicit decision.

## Sources

- Blueprint section 7 item 5: the reference platform offers non-sophisticated
  investors a free revocation window of 4 calendar days from offer submission
  (its T&Cs cite Art. 22 of the ECSP Regulation), exercisable via a
  cancellation button or email; afterwards the offer is bound until the offer
  period ends. Sophisticated investors are bound immediately.
- Blueprint section 14.2: `InvestmentOrder` state machine with an optional
  cancellable reflection branch whose applicability and length depend on
  investor class, legal regime and campaign terms.
- Blueprint line 401: cancellation must be as easy as the invest action;
  settlement of the affected funds is blocked until the window expires;
  the reflection period is a floor, not the only withdrawal right.
- Regulation (EU) 2020/1503 (ECSPR), Art. 22 - the authoritative text is
  EUR-Lex; confirm the exact provision there before any implementation.
  The site's legal pages already state honestly that the demo has no such
  mechanism (risk disclosure: "Blockallisto's demo has none of these
  mechanisms").

## Current prototype reality (verified, not assumed)

- Contributions go straight into the Soroban escrow contract.
- Refund exists only after the deadline when the goal is missed
  (all-or-nothing); any pre-deadline refund is rejected on-chain
  (`#6 CampaignNotEnded`, recorded testnet evidence).
- The contract stores one aggregate balance per investor, not per
  contribution, so per-offer reflection windows have no on-chain anchor.
- Investor categorisation is prototype-only; the "non-sophisticated" class
  the reflection right attaches to does not exist in the prototype.

## Options

**A. Contract-level reflection.** New contract method `cancel_contribution`
permitted while `now < min(deadline, contribution_timestamp + window)`,
with per-contribution records replacing the aggregate balance, and creator
withdraw excluding amounts still inside their window (or campaign deadlines
constrained to outlast the latest window). Existing deployed contracts are
immutable; this means new contract versions and redeployed campaigns.

**B. Off-chain offer stage.** Offers are recorded platform-side and funds
move only after the window expires. Matches the regulated model more
closely but is incompatible with the current direct-escrow prototype; it
belongs to a regulated redesign, not this codebase increment.

**C. Prototype simulation.** A clearly labeled illustrative UI walk-through
on fixture data (like the knowledge test), no chain interaction, no claim
of a real right. The only variant compatible with "no contract change".

## Open decisions (owner + legal)

1. Which investor classes get the window and under which regime
   (categorisation criteria need legal review first).
2. Option A vs B for any real version; option C only as demo content.
3. Cancellation channel: in-app button is mandatory ("as easy as invest");
   email revocation needs a support workflow with clock-safe timestamps.
4. Interaction with campaign terms (window length per campaign/jurisdiction,
   deadline vs last-contribution timing).
