---
name: compliant-eu-tokenization-cloud-infrastructure
description: Design and deploy GDPR and DORA compliant cloud infrastructure for tokenized crowdfunding platforms on the Stellar network.
---

When to use
Use this skill when designing, auditing, or deploying infrastructure for a European Union-based financial platform that utilizes the Stellar blockchain for asset tokenization. This is specifically for ensuring compliance with EU data residency and financial security regulations.

## Instructions
1.  **Region Selection**: Default to EU regions (e.g., `eu-central-1`, `eu-west-3`) to ensure all "Data at Rest" remains within the European Economic Area (EEA) for GDPR compliance.
2.  **Stellar Node Architecture**: 
    *   Deploy Stellar Core and Horizon nodes using container orchestration (Kubernetes/EKS).
    *   Implement a "Full History" node strategy to ensure auditability required by EU financial regulators.
3.  **Security Hardening (DORA Standard)**:
    *   Implement Multi-AZ (Availability Zone) deployments to meet the Digital Operational Resilience Act (DORA) requirements for high availability.
    *   Use Hardware Security Modules (HSM) or managed KMS for managing Stellar secret keys.
4.  **Data Sovereignty**:
    *   Configure strict IAM policies to prevent cross-border data transfers.
    *   Enable VPC Flow Logs and CloudTrail for continuous compliance monitoring.
5.  **Tokenization Bridge**: Setup secure API gateways with OAuth2 and mTLS for communication between the legacy banking systems (SEPA/Swift) and the Stellar network.

## Examples
**Scenario**: A startup needs a production environment for a tokenized real estate platform in Germany.
*   **Action**: Provision an AWS EKS cluster in `eu-central-1`.
*   **Action**: Set up a PostgreSQL RDS instance with encrypted storage at rest using a customer-managed key.
*   **Action**: Deploy a Stellar Horizon instance connecting to the public network but with a private validator node to ensure transaction finality speed.

## Constraints
*   **NEVER** store unencrypted private keys in environment variables or version control.
*   **NEVER** use non-EU cloud regions for storing PII (Personally Identifiable Information) or transaction ledgers.
*   **DO NOT** allow public SSH access; use Bastion hosts or Session Manager.
*   **DO NOT** bypass the Stellar Compliance Protocol (SEP-3) when handling EU investor onboarding.