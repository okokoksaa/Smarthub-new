# AI Assistive Services Layer

This document details the architecture, constraints, and explicit prohibitions of the AI Assistive Services Layer in the CDF Smart Hub.

## 1. AI Layer Positioning & Constraints

The single most critical architectural constraint is that the **AI Layer is strictly an advisory service**. It is designed to assist and guide human decision-makers, not to replace them. The system is architecturally designed to ensure humans always make the final decision.

### Core Principles:

*   **AI Assists, Humans Decide**: The AI provides recommendations, flags, scores, and guidance.
*   **Read-Only Access**: The AI layer consumes data from the System of Record but **cannot** write to it.
*   **No Transactional Authority**: The AI **cannot** execute business transactions (e.g., approve projects, execute payments).
*   **No Overrides**: The AI **cannot** override a human decision.

### Service Invocation Pattern

All interactions with the AI layer follow a strict, auditable pattern:

1.  A Core Transactional Service validates a business rule.
2.  It invokes the AI Service with a specific question (e.g., "Analyze this payment for anomalies").
3.  The AI Service returns its analysis (e.g., a risk score and an explanation).
4.  This AI output is presented to the human user alongside the core data.
5.  The human makes a final decision (e.g., approve or reject), providing a justification, especially if they are overriding an AI flag.
6.  Both the AI's output and the human's final decision are logged immutably in the Audit Layer.

## 2. AI Service Architecture

The AI layer is a set of microservices designed for isolation and specific functions.

*   **AI API Gateway**: A dedicated gateway that isolates the AI services, handles rate limiting, and routes requests.
*   **AI Orchestration Service**: The central brain of the AI layer. It routes requests to the appropriate model, aggregates responses, enforces governance policies, and ensures all AI inferences are logged.
*   **Specialized AI Services**: Individual services for specific tasks:
    *   **Document Intelligence**: Handles OCR, data extraction, and completeness checks on uploaded documents.
    *   **Financial Anomaly Detection**: Identifies unusual patterns, outliers, and potential duplicates in payments.
    *   **Compliance Guidance**: Uses a rule engine and NLP to provide guidance based on the CDF Act and other regulations.
*   **Training Data Repository**: A versioned, immutable repository of the data used to train the ML models, ensuring reproducibility and auditability.

## 3. AI Failure Containment

The system is designed to be fully functional even if the entire AI layer fails. AI is an enhancement, not a critical dependency.

*   **Graceful Degradation**: If an AI service is unavailable or times out (e.g., after 10 seconds), the core system continues without it. The user is notified that AI assistance is unavailable and proceeds with a manual review.
*   **Circuit Breaker Pattern**: After several consecutive failures, the system will temporarily stop calling the failing AI service to prevent cascading failures. It will periodically re-test the connection and restore the service once it is stable.
*   **Human Review as Fallback**: The default fallback for any AI failure is a mandatory human review.

## 4. Explicit AI Prohibitions (Architecturally Enforced)

These prohibitions are not just policies; they are enforced by the system's architecture (e.g., through database permissions, API gateway rules, and service isolation). The AI Layer **CANNOT**:

1.  **Approve or reject projects or payments**.
2.  **Execute any financial transactions**.
3.  **Modify the System of Record** (it has SELECT-only database privileges).
4.  **Delete or modify audit logs** (it has zero access to the audit write APIs).
5.  **Override a human decision**.
6.  **Grant or revoke user access**.
7.  **Modify any system configuration or workflow**.
8.  **Communicate officially to citizens or external parties**.
9.  **Determine legal compliance** (it can only flag potential issues for human legal experts).
10. **Access data outside of the requesting user's tenant scope**.
