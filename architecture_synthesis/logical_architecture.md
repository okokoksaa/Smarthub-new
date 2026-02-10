# CDF Smart Hub - Logical Architecture

This document outlines the five-layer logical architecture of the CDF Smart Hub, designed for separation of concerns, security, and scalability.

## 1. Five-Layer Model Overview

The architecture is composed of five distinct layers, each with a specific responsibility:

1.  **Presentation Layer**: The user-facing interfaces.
2.  **API Gateway Layer**: The single entry point for all client requests, handling cross-cutting concerns.
3.  **Business Logic Layer**: The core of the application, containing all services and business rules.
4.  **Data Persistence Layer**: Manages the storage of all operational data.
5.  **Audit & Compliance Layer**: An independent layer for immutable logging and verification.

---

### Layer 1: Presentation Layer

*   **Components**:
    *   **Public Portal (Read-Only)**: Provides transparent access to sanitized project and financial data for citizens. Built with modern web frameworks (e.g., React/Vue).
    *   **Web Interface (Operational)**: The primary interface for all internal users (CDFC, Finance Officers, etc.) to perform their duties.
    *   **Mobile Apps (PWA/Native)**: Enables offline-first capabilities for field officers like WDC members, allowing them to work in areas with poor connectivity.
*   **Communication**: All presentation layer components communicate with the backend exclusively through the API Gateway via secure HTTPS/TLS connections.

### Layer 2: API Gateway Layer

*   **Function**: Acts as a secure front door for all incoming requests.
*   **Core Responsibilities**:
    *   **Authentication & Authorization**: Verifies user identity (JWT) and checks permissions.
    *   **Rate Limiting**: Protects services from abuse and DDoS attacks.
    *   **Request Routing**: Directs incoming requests to the appropriate microservice in the Business Logic Layer.
    *   **Multi-Tenancy Enforcement**: Ensures users can only access data within their authorized constituency or scope.
    *   **Request Logging**: Captures metadata for every incoming request before it hits the business logic.

### Layer 3: Business Logic Layer

This is the largest layer, containing three distinct categories of services that communicate via an asynchronous Service Bus (e.g., Kafka, RabbitMQ).

*   **A. Core Transactional Services (System of Record)**:
    *   **Principle**: This is the **authoritative source of truth**. These services are the only ones permitted to write to the operational database.
    *   **Services**: Project Management, Financial Management, Workflow Orchestration, Document Management, User & Role Management, Committee Management.

*   **B. AI Assistive Services Layer (Advisory Only)**:
    *   **Principle**: This layer is strictly **advisory and has no decision-making authority**. It has read-only access to the System of Record and cannot write data or execute transactions.
    *   **Services**: Document Intelligence (OCR), Anomaly Detection, Risk Scoring, Predictive Analytics, Conflict Detection.

*   **C. Support Services**:
    *   **Principle**: Provides shared capabilities and orchestrates complex tasks.
    *   **Services**: Notification Service (SMS/Email), Reporting Service, Search & Analytics, Geospatial Service, Workflow Engine, Integration Service.

### Layer 4: Data Persistence Layer

*   **Function**: Manages the storage and retrieval of operational data.
*   **Components**:
    *   **Operational DB (PostgreSQL)**: The primary multi-tenant database for the System of Record.
    *   **Document Storage (S3-compatible)**: Immutable, versioned storage for all uploaded documents.
    *   **Cache Layer (Redis)**: Stores temporary session data, caches frequent queries to improve performance.

### Layer 5: Audit & Compliance Layer (Independent)

*   **Principle**: This layer is architecturally separate and independent to ensure its integrity. It receives data via a **dual-write** mechanism from the Business Logic Layer but cannot be modified by it.
*   **Component**:
    *   **Immutable Audit Log (WORM Storage)**: All transactions, decisions, and access attempts are written here. It uses blockchain-inspired hash-chaining and HSM-secured timestamps to create a legally admissible evidence trail with a 10-year retention policy.

---

## External Integrations

The system integrates with critical external government and financial systems via a dedicated **Integration Service Layer**. This isolates the core system from the complexities of third-party APIs.

*   **Key Integrations**: Banks (for payments), IFMIS, ZPPA, Mobile Money, Office of the Auditor General, National ID System, and Government PKI (for digital signatures).
