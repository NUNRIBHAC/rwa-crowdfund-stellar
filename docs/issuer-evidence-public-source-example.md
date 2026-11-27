# Public-source dossier example: Kipster

## Prepared site integration

`AssistantDocumentaryReview` is a read-only section on the existing For Investors page. It presents a historical public-source example reviewed by Instinct on 26 November 2026. It is not associated with a Blockallisto campaign, does not seed `ISSUER_EVIDENCE_JSON`, and creates no campaign or review record. It has no transaction, editor, new route or API behavior.

The assistant's documentary review is deliberately separate from `issuer_claim` and `checked_fact`. It cannot satisfy the latter's human-review requirement and receives no human-reviewed badge. A professional or human attestation is neither claimed nor a prerequisite for this assistant presentation.

The section's 16 text entries are prepared in each of the 11 UI languages. Publication requires the usual Weblate round trip, tests and per-PR release approval. Local preparation is not a deployment.

## Five findings and their limits

1. **Identity.** The KIIS names Kipster Production B.V., Venlo, KvK 69940320. GLEIF's official LEI record names Kipster Holding B.V. and records the previous name. No KvK extract was read.
2. **Historical offer.** The promoter's KIIS describes STAK depositary receipts at EUR 25, minimum investment EUR 250, target EUR 700,000 to EUR 3.5 million with a EUR 5 million raise option, deadline 12 December 2024. Single promoter source. This is not a currently open offer here.
3. **Platform.** The KIIS names Oneplanetcrowd International B.V. (Invesdor). The AFM PDF lists a crowdfunding licence from 15 September 2022 and no end date. The undated copy does not establish current licence standing. The official ESMA entry was not read.
4. **Closing amount.** The promoter reports EUR 3,700,275 and 1,373 investors. The KIIS provides a EUR 3.7 million subscription cut-off and conditional excess subscriptions after a 14-day cancellation period. A reported total above EUR 3.5 million is not by itself evidence of an unlawful excess. Use of the raise option and the final retained amount are unknown. The impact report's EUR 3.3 million is unreconciled. The KIIS's pairing of 200,000 receipts at EUR 25 with EUR 5.2 million is internally inconsistent.
5. **Financial figures.** The compiled 2023 statements report EUR 83,012 result, versus EUR -423,315 after profit transfer in the KIIS table. Their entity scope and definitions remain unreconciled. The compilation is not an audit. No unsupported group-account explanation is inferred.

## Sources read, 26 November 2026

- KIIS, promoter document published by the platform: https://kapilendo-public.imgix.net/files/projects/kipster-01/f81411f6-d320-414a-8339-c15a98f467fe_KIIS_EN_NL.pdf
- Promoter's closing announcement, dated 16 January 2025: https://kipster.nl/deelnemers-bedankt/
- Official GLEIF LEI record, not a company-register extract: https://api.gleif.org/api/v1/lei-records/7245007JQYIGW328K081
- AFM register copy, no document date established: https://www.afm.nl/~/profmedia/files/registers/register-crowdfunding-platformen.pdf
- Company statements, compilation not audit: https://dl.invesdor.de/projects/public/33b141d4-3ce6-483d-9860-de77b1cbd7c4/plink/20240521_Kipster_Production_BV_Jaarrekening_2023_getekend.pdf
- Promoter's 2024 impact report: https://kipster.nl/app/uploads/2025/05/Impactreport-2024-NL.pdf

Retrieval is not publication. English KIIS pages 1 to 6 and signed responsibility statement on page 13 were read in full. Dutch pages 7 to 12 were checked for amounts, names and terms, not sentence-by-sentence equivalence. Financial key pages and the ownership chart were inspected as images. The chart is the promoter's 24 July 2024 snapshot, not registry verification. No audited or group accounts, legal, credit or suitability opinion, or current-performance conclusion is supplied.

This replaces the earlier documentation-only EIB identity comparison as the worked example. It does not alter the production dossier correction rules documented in `issuer-evidence-dossier.md`. No live permissions, environment settings, evidence records or source configuration are changed.
