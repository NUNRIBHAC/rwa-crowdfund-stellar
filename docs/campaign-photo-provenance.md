# Campaign photography

Every current and future TESTNET DEMO listing card and campaign page renders a photo through
`CampaignPhoto`. Until authorized issuer photographs are supplied, the testnet
site uses a shared illustrative photograph with a permanent visible caption:
"Illustrative photo - not the actual project." The caption and factual alt text
are translated by the existing locale catalogue. An image is not proof of an
asset, ownership, valuation, issuer identity or platform verification.

## Existing illustrative asset

- Local file: `frontend/public/demo-solar-farm.jpg`
- Subject: aerial photograph of Webberville Solar Farm near Austin, Texas
- Author: The tdog
- Source: https://commons.wikimedia.org/wiki/File:Webberville_Solar_Farm_Near_Austin_Texas_from_the_Air.JPG
- Licence: CC0 1.0 Universal Public Domain Dedication, confirmed on the source
  page on 3 November 2026. No paid image licence or purchase was made.
- Existing repository asset introduced by commit `9503483e3946db4c4b50cc61dc59cfea8849d46b`.

This is a temporary illustrative fallback for unmapped testnet campaigns, not a
claim that every campaign concerns solar energy or that the photo shows its
project. Real issuer photographs must carry a source, rights confirmation,
factual alt text and accurate caption before replacing the illustration.

## Acceptance

- Every card and detail page, including an unknown/new campaign ID, has a photo.
- The permanent illustrative caption is visible without hover at every width.
- Both placements use the same shared component, not independently maintained
  conditional image checks.
- A broken campaign-specific image falls back to the existing local illustration.
- No generated or stock image may be labelled as verified project photography.
- Genuine issuer-media upload, rights review and listing approval remain part of
  the connected business submission workflow; this rendering change does not
  claim that workflow has been completed.

## Real publication gate (not activated)

A future actual issuer listing must have its own authorized issuer photograph,
source and rights confirmation before publication. The unrelated solar demo
fallback does not satisfy that requirement. Real investment publication remains
disabled; this demo rendering change grants no permission to activate it.
