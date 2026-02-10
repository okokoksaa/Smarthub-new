# Multi-Tenant Isolation Model

This document outlines the multi-tenancy architecture of the CDF Smart Hub, which is designed to ensure that data is strictly isolated and that users can only access information within their authorized scope.

## 1. Five-Tier Tenancy Hierarchy

The system uses a five-tier hierarchical model to represent the administrative structure of Zambia's government:

1.  **National**: The top level, with visibility across the entire system (for roles like Ministry officials and Auditors).
2.  **Provincial**: 10 provinces, each containing multiple districts.
3.  **District**: 116 districts, each containing multiple constituencies.
4.  **Constituency**: 156 constituencies, the primary operational unit for CDF.
5.  **Ward**: 624+ wards, the finest level of granularity, where community projects are initiated.

Every piece of data in the system is tagged with its corresponding tenant IDs (e.g., `province_id`, `constituency_id`, `ward_id`), allowing for precise, granular access control.

## 2. Tenant Isolation Enforcement

Data isolation is not left to chance; it is enforced automatically at multiple layers of the architecture to create a robust, defense-in-depth security model.

### Database Level: Row-Level Security (RLS)

The primary enforcement mechanism is at the database level using PostgreSQL's Row-Level Security.

*   **How it Works**: For every table containing tenant-scoped data, a security policy is created. This policy is a rule that the database automatically applies to every single query (SELECT, INSERT, UPDATE, DELETE).
*   **Example**: A policy on the `projects` table ensures that a user can only see projects where the `constituency_id` matches one of the constituencies they are assigned to. If a Finance Officer assigned only to Kabwata tries to query for projects in Mandevu, the database will return zero results, as if the data does not exist. This happens automatically and cannot be bypassed by application code.

```sql
-- Example RLS Policy for a Finance Officer
CREATE POLICY constituency_isolation ON projects
    USING (
        constituency_id IN (
            -- This subquery fetches the constituencies assigned to the current user
            SELECT constituency_id 
            FROM user_constituency_assignments 
            WHERE user_id = current_user_id()
        )
        -- Or allows full access for national-level roles
        OR current_user_role() IN ('Ministry', 'Auditor')
    );
```

### Application Level: API Gateway

As a second layer of defense, the API Gateway also validates tenant scope before forwarding a request to the backend services.

*   **How it Works**: When a user makes a request (e.g., `GET /api/projects/PROJ-123`), the API Gateway performs the following checks:
    1.  Authenticates the user's JWT token.
    2.  Retrieves the user's tenant scope (e.g., `constituency_id: 45`).
    3.  Fetches the tenant scope of the requested resource (e.g., `PROJ-123` belongs to `constituency_id: 58`).
    4.  Compares the scopes. If they do not match, the gateway immediately rejects the request with a `403 Forbidden` error, and the request never even reaches the core business logic.

## 3. AI Service Tenant Isolation

Critically, the AI services are also subject to tenant isolation and **cannot** bypass it.

*   **Inherited Scope**: When a user requests an AI analysis, the AI service inherits the tenant scope of that user. For example, if a Finance Officer from Constituency A requests anomaly detection, the AI is only permitted to query and use data from Constituency A (and anonymized national benchmarks) to perform its analysis. It is architecturally prevented from accessing data from any other constituency.
