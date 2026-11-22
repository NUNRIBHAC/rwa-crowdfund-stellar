# Presentation catalog: 44 fictional businesses

The presentation catalog contains 44 fictional campaigns in 14 sectors. Of these, 34 are open or closing and 10 illustrate other lifecycle states. The seven educational concepts appear only in Learn. They are not catalog results, filter types or campaign routes. Existing concept campaign URLs are mapped to Learn.

## Fictional scenarios and real testnet contracts

All 44 businesses have distinctive names and business descriptions in all 11 languages. Existing campaign IDs, instrument labels, seniority, overlays, indirect-participation structures and illustrative lifecycle states are preserved. These stories and instrument examples create no investor rights.

Each business is now paired with one separately created, reviewed v1 crowdfunding escrow contract on Stellar Testnet. The checked-in identity map contains IDs only, not funding amounts or lifecycle values. The Contract data link opens the real registered campaign in a separate tab with explicit `?fixtures=0`. This prevents fictional preview amounts and states from being presented as on-chain facts. The real contract page reads its goal, deadline, funding and per-wallet balance from the registry API. Its existing contribution-terms disclosure explains that escrow records issue no shares, loans, interest, voting or ownership rights.

The 44 creations were confirmed on 22 November 2026. Every contract began empty, with the existing staging creator, test USDC and a common deadline of 6 December 2026 at 23:59 UTC. Goals match the existing fictional-business targets. The creation receipts, ledgers, exact fees and contract parameters are recorded in `docs/testnet-catalog44.json`. Testnet assets have no real monetary value. Network resets can remove these records.

## Default view

Without an explicit mode choice, Home, the campaign list and fictional campaign details use the read-only presentation scenarios. Account, financing and real campaign details do not default to sample mode. An explicit `?fixtures=0` selects the real registry; `?fixtures=1` selects the sample preview. The existing switch returns to the real registry. A real-data link opens a new tab so the explicit URL mode is applied from the start without changing the preview's state.

Network loading is tracked independently of presentation availability. An available fictional catalog never marks the real network request complete.

## Home states

Home selects one existing open example, one funded example and one ended example, in that order. It prefers the nearest deadline for open campaigns and the most recent deadline for the other states. IDs break ties consistently. If a state is missing in the selected source, no campaign is invented to fill it.

## Boundaries

Fictional cards and details remain read-only and keep their sample notices. Opening actual contract data does not sign, contribute, withdraw or refund. No deployment key is bundled with the application. The staging load contract and previous registry entries are retained, not deleted or altered.

Photography remains separate. Current catalog data uses the existing illustrative covers. No photograph is presented as evidence of a real issuer, project, ownership or valuation.
