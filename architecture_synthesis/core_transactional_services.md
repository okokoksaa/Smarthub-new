# Core Transactional Services (System of Record)

This document details the architecture of the Core Transactional Services, which together form the authoritative **System of Record** for all CDF operations.

## Design Principle: Single Source of Truth

The most critical architectural principle is that these core services represent the single, unambiguous source of truth for all data and transactions. All other systems and layers, including the AI and Reporting services, are **consumers** of this data, not producers. This prevents data fragmentation and ensures consistency.

This is achieved through a microservices-style architecture where each service has clear ownership over a specific business domain. These services communicate with each other asynchronously via an **event-driven architecture**.

## Event-Driven Architecture

When a core service performs a significant action, it publishes a domain event to a central message bus (e.g., Apache Kafka or RabbitMQ). Other services can then subscribe to these events to perform their own tasks.

*   **Example Flow**: When the `Project Management Service` approves a project, it publishes a `ProjectApprovedByPLGO` event. The `Financial Management Service` subscribes to this event to create a budget commitment, and the `Notification Service` subscribes to it to alert the relevant stakeholders.

*   **Key Benefits**: This decouples the services, improves resilience (if one service is down, others can still consume events later), and enhances scalability.

## Service Boundaries

### 1. Project Management Service

*   **Owns**: Projects, Applications, Approvals, and all Project-related Status Transitions.
*   **Core Responsibilities**:
    *   Manages the lifecycle of a project from application to completion.
    *   Handles the creation and validation of new project applications.
    *   Orchestrates the multi-step approval process (CDFC, TAC, PLGO).
    *   Enforces workflow state transitions for projects.
*   **Database Tables**: `projects`, `project_approvals`, `project_documents`.
*   **Publishes Events**: `ProjectSubmitted`, `ProjectApprovedByCDFC`, `ProjectApprovedByPLGO`, `ProjectStatusChanged`.

### 2. Financial Management Service

*   **Owns**: Budgets, Commitments, Expenditures, and Payments.
*   **Core Responsibilities**:
    *   Manages budget allocations at the national, provincial, and constituency levels.
    *   Tracks financial commitments when projects are approved.
    *   Processes payment vouchers and manages the payment approval workflow (Panel A/B).
    *   Integrates with the Bank Adapter for payment execution and bank statement reconciliation.
*   **Database Tables**: `budgets`, `commitments`, `payments`, `bank_transactions`.
*   **Publishes Events**: `PaymentRequested`, `PaymentApproved`, `PaymentExecuted`, `BudgetAllocated`.

### 3. Workflow Orchestration Service

*   **Owns**: State Machine Definitions, Service Level Agreement (SLA) Tracking, and Escalations.
*   **Core Responsibilities**:
    *   Provides a centralized engine for defining and executing all business workflows (e.g., project approval, payment processing).
    *   Tracks the time spent in each workflow state and triggers alerts or escalations if SLAs are breached.
    *   Manages the logic for deemed approvals and other time-based state transitions.
*   **Database Tables**: `workflow_definitions`, `workflow_instances`, `sla_logs`.
*   **Publishes Events**: `SlaBreached`, `WorkflowEscalated`.

### 4. Document Management Service

*   **Owns**: Document Storage, Versioning, and Hash Verification.
*   **Core Responsibilities**:
    *   Handles the secure upload and storage of all documents in an immutable object store (S3-compatible).
    *   Calculates a cryptographic hash (SHA-256) for every document upon upload and verifies it on every access to ensure integrity.
    *   Manages document version history.
    *   Provides the API for the public-facing QR code verification system.
*   **Storage**: S3-compatible object storage with versioning and immutability enabled.
*   **Publishes Events**: `DocumentUploaded`, `DocumentVerified`.

### 5. Committee Management Service

*   **Owns**: Committees (CDFC, WDC, TAC), Members, Meetings, Votes, and Conflicts of Interest.
*   **Core Responsibilities**:
    *   Manages the scheduling of meetings and recording of attendance.
    *   Facilitates the digital voting process, ensuring quorum rules are met and recording individual votes immutably.
    *   Manages the creation and approval of meeting minutes.
    *   Tracks and enforces conflict of interest declarations.
*   **Database Tables**: `committees`, `members`, `meetings`, `votes`, `conflicts_of_interest`.
*   **Publishes Events**: `MeetingScheduled`, `VoteRecorded`, `MinutesApproved`.
