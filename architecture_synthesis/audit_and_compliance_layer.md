# Audit & Compliance Layer

This document describes the architecture of the Audit & Compliance Layer, which is designed to be an independent and legally defensible source of truth for all actions taken within the CDF Smart Hub.

## 1. Design Principle: Independence and Immutability

The entire layer is architecturally separate from the operational system to ensure its integrity. Its primary purpose is to provide a tamper-proof, independently verifiable log of every transaction, decision, and access attempt.

Key principles:

*   **Independence**: The audit layer is not controlled by the operational services. It receives data but cannot be modified by them.
*   **Immutability**: Once an audit log is written, it cannot be altered or deleted, even by system administrators.
*   **Legal Defensibility**: The architecture is designed to produce evidence that is admissible in a court of law.

## 2. Immutable Audit Log Architecture

This is achieved through a combination of a dual-write mechanism, specialized storage, and cryptographic verification.

*   **Audit Log Service (Write-Only API)**: All core services send their audit entries to this single service. It validates the entry, calculates the hash chain, and then performs a dual-write.

*   **Dual-Write Mechanism**: For every audit event, the entry is written to two destinations simultaneously:
    1.  **Operational Audit Database (PostgreSQL)**: A queryable, indexed database that allows for fast searching and reporting by auditors.
    2.  **WORM Storage (Immutable)**: The official, long-term, unchangeable record.

*   **Integrity Verification Service**: A service runs daily to compare the operational database against the WORM storage and validate the entire hash chain, immediately alerting auditors and the Ministry to any discrepancy.

### WORM Storage Implementation

Write-Once-Read-Many (WORM) storage is the cornerstone of the audit trail's integrity.

*   **Technology**: Implemented using cloud services like AWS S3 Object Lock (in Compliance Mode) or Azure Immutable Blob Storage.
*   **Retention**: A minimum 10-year retention policy is enforced at the storage layer, which cannot be overridden, even by root administrator accounts.
*   **No Deletion/Modification**: Once written, objects cannot be deleted or modified for the duration of the retention period.

### Hash-Chaining Algorithm

To prevent tampering, audit entries are linked together in a blockchain-inspired cryptographic chain.

1.  **Genesis Entry**: The first entry in the log is a known, hardcoded "genesis" block.
2.  **Chaining**: Each subsequent entry's hash is calculated using the data of the current entry **plus the hash of the previous entry**.
    *   `hash(N) = SHA256( hash(N-1) + data(N) + timestamp(N) )`
3.  **Tamper Detection**: If any entry in the chain is altered, its hash will no longer match the hash stored in the next entry, and the chain will be broken. The daily verification service would immediately detect this break and raise an alert.

## 3. Auditor Access & Tools

To make this data useful, the Office of the Auditor General (OAG) is provided with a dedicated, independent **Auditor Portal**.

*   **Function**: This portal provides auditors with the tools to search, filter, and analyze the audit logs without needing direct database access.
*   **Key Features**:
    *   **Audit Query Interface**: Search logs by user, project, date, or action.
    *   **AI Audit Tools**: View all AI inferences, explanations, and human overrides.
    *   **Forensic Investigation Tools**: Reconstruct the state of any entity at any point in history and trace the flow of funds.
*   **Access Controls**: Auditor access requires MFA, and all auditor actions are themselves logged to ensure accountability.
