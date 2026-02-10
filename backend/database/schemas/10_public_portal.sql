-- ============================================================================
-- CDF SMART HUB - PUBLIC TRANSPARENCY PORTAL SCHEMA
-- ============================================================================
-- Purpose: Public-facing data for transparency and citizen engagement
-- Access: Read-only for public citizens (CITIZEN role)
-- Compliance: Open Government Partnership, Access to Information Act
-- ============================================================================

-- ============================================================================
-- PUBLISHED PROJECTS
-- ============================================================================
-- Public view of approved projects (excludes sensitive data)
CREATE TABLE published_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Public Information
    project_number VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category project_category NOT NULL,

    -- Location
    constituency_name VARCHAR(100) NOT NULL,
    ward_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    province_name VARCHAR(100) NOT NULL,

    -- Financial (rounded for privacy)
    approved_budget NUMERIC(15, 0) NOT NULL, -- No cents in public view
    amount_disbursed NUMERIC(15, 0) NOT NULL DEFAULT 0,
    balance_remaining NUMERIC(15, 0) NOT NULL,

    -- Status & Progress
    status project_status NOT NULL,
    progress_percentage INTEGER NOT NULL DEFAULT 0,

    -- Timeline
    approval_date DATE,
    start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,

    -- Beneficiaries (aggregated)
    estimated_beneficiaries INTEGER,
    direct_jobs_created INTEGER,

    -- Publishing
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_published BOOLEAN NOT NULL DEFAULT true,

    -- SEO & Discovery
    search_keywords TEXT,               -- Generated keywords for search

    UNIQUE(project_id)
);

CREATE INDEX idx_published_projects_status ON published_projects(status);
CREATE INDEX idx_published_projects_constituency ON published_projects(constituency_name);
CREATE INDEX idx_published_projects_category ON published_projects(category);
CREATE INDEX idx_published_projects_search ON published_projects USING gin(to_tsvector('english', title || ' ' || description));

COMMENT ON TABLE published_projects IS 'Public-facing project information for transparency portal';

-- ============================================================================
-- PUBLISHED FINANCIAL SUMMARIES
-- ============================================================================
-- Constituency-level financial summaries
CREATE TABLE published_financial_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Scope
    constituency_id UUID NOT NULL REFERENCES constituencies(id),
    constituency_name VARCHAR(100) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),

    -- Allocations
    annual_allocation NUMERIC(15, 0) NOT NULL,
    quarterly_allocation NUMERIC(15, 0),

    -- Expenditure
    total_expenditure NUMERIC(15, 0) NOT NULL DEFAULT 0,
    expenditure_percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE
            WHEN annual_allocation > 0 THEN (total_expenditure::NUMERIC / annual_allocation * 100)
            ELSE 0
        END
    ) STORED,

    -- By Category
    infrastructure_expenditure NUMERIC(15, 0) DEFAULT 0,
    education_expenditure NUMERIC(15, 0) DEFAULT 0,
    health_expenditure NUMERIC(15, 0) DEFAULT 0,
    water_sanitation_expenditure NUMERIC(15, 0) DEFAULT 0,
    agriculture_expenditure NUMERIC(15, 0) DEFAULT 0,
    bursary_expenditure NUMERIC(15, 0) DEFAULT 0,
    empowerment_expenditure NUMERIC(15, 0) DEFAULT 0,
    other_expenditure NUMERIC(15, 0) DEFAULT 0,

    -- Projects
    total_projects INTEGER NOT NULL DEFAULT 0,
    completed_projects INTEGER NOT NULL DEFAULT 0,
    active_projects INTEGER NOT NULL DEFAULT 0,
    planned_projects INTEGER NOT NULL DEFAULT 0,

    -- Beneficiaries
    total_beneficiaries INTEGER DEFAULT 0,
    bursary_beneficiaries INTEGER DEFAULT 0,
    empowerment_beneficiaries INTEGER DEFAULT 0,

    -- Publishing
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(constituency_id, fiscal_year, quarter)
);

CREATE INDEX idx_published_finance_constituency ON published_financial_summaries(constituency_id);
CREATE INDEX idx_published_finance_year ON published_financial_summaries(fiscal_year);

COMMENT ON TABLE published_financial_summaries IS 'Public constituency financial summaries by quarter';

-- ============================================================================
-- PUBLISHED DOCUMENTS
-- ============================================================================
-- Public documents (meeting minutes, reports, etc.)
CREATE TABLE published_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id),

    -- Document Details
    document_number VARCHAR(100) NOT NULL,
    document_type document_type NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,

    -- Location
    constituency_name VARCHAR(100),
    ward_name VARCHAR(100),

    -- File Access (via CDN)
    public_url TEXT NOT NULL,           -- CDN URL for public access
    file_size_mb NUMERIC(10, 2),
    thumbnail_url TEXT,

    -- Metadata
    document_date DATE,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    download_count INTEGER NOT NULL DEFAULT 0,

    -- Moderation
    is_published BOOLEAN NOT NULL DEFAULT true,
    published_by UUID REFERENCES users(id),

    UNIQUE(document_id)
);

CREATE INDEX idx_published_docs_type ON published_documents(document_type);
CREATE INDEX idx_published_docs_constituency ON published_documents(constituency_name);
CREATE INDEX idx_published_docs_date ON published_documents(document_date DESC);

COMMENT ON TABLE published_documents IS 'Public documents available for citizen download';

-- ============================================================================
-- CITIZEN QUERIES
-- ============================================================================
-- Public questions/queries from citizens
CREATE TABLE citizen_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_number BIGSERIAL UNIQUE,

    -- Query Details
    query_subject VARCHAR(500) NOT NULL,
    query_text TEXT NOT NULL,
    query_category VARCHAR(100),        -- 'PROJECT_INFO', 'FINANCIAL', 'COMPLAINT', 'SUGGESTION'

    -- Citizen (optional authentication)
    citizen_name VARCHAR(200),
    citizen_email VARCHAR(255),
    citizen_phone VARCHAR(20),
    is_authenticated BOOLEAN NOT NULL DEFAULT false,
    user_id UUID REFERENCES users(id),  -- If logged in

    -- Context
    related_project_id UUID REFERENCES projects(id),
    constituency_id UUID REFERENCES constituencies(id),
    ward_id UUID REFERENCES wards(id),

    -- Response
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'UNDER_REVIEW', 'RESPONDED', 'CLOSED'
    assigned_to UUID REFERENCES users(id),
    response_text TEXT,
    response_timestamp TIMESTAMP WITH TIME ZONE,
    response_by UUID REFERENCES users(id),

    -- SLA
    response_due_date DATE,
    is_overdue BOOLEAN GENERATED ALWAYS AS (
        status IN ('PENDING', 'UNDER_REVIEW') AND response_due_date < CURRENT_DATE
    ) STORED,

    -- Privacy
    is_public BOOLEAN NOT NULL DEFAULT false, -- Can this query-response be shown publicly?

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_citizen_queries_status ON citizen_queries(status);
CREATE INDEX idx_citizen_queries_constituency ON citizen_queries(constituency_id);
CREATE INDEX idx_citizen_queries_project ON citizen_queries(related_project_id);
CREATE INDEX idx_citizen_queries_timestamp ON citizen_queries(created_at DESC);
CREATE INDEX idx_citizen_queries_overdue ON citizen_queries(is_overdue) WHERE is_overdue = true;

COMMENT ON TABLE citizen_queries IS 'Public queries and feedback from citizens';

-- ============================================================================
-- CITIZEN FEEDBACK
-- ============================================================================
-- Feedback on completed projects
CREATE TABLE citizen_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Project
    project_id UUID NOT NULL REFERENCES projects(id),
    published_project_id UUID REFERENCES published_projects(id),

    -- Citizen
    citizen_name VARCHAR(200),
    citizen_email VARCHAR(255),
    citizen_phone VARCHAR(20),
    is_verified BOOLEAN NOT NULL DEFAULT false,

    -- Feedback
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback_category VARCHAR(100),     -- 'QUALITY', 'TIMELINESS', 'IMPACT', 'ACCESSIBILITY'
    feedback_text TEXT,

    -- Project Assessment
    project_meets_need BOOLEAN,
    would_recommend BOOLEAN,

    -- Photos (citizen-submitted)
    photo_urls TEXT[],

    -- Moderation
    is_approved BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    moderation_notes TEXT,

    -- Publishing
    is_published BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET
);

CREATE INDEX idx_citizen_feedback_project ON citizen_feedback(project_id);
CREATE INDEX idx_citizen_feedback_rating ON citizen_feedback(rating);
CREATE INDEX idx_citizen_feedback_approved ON citizen_feedback(is_approved) WHERE is_approved = true;
CREATE INDEX idx_citizen_feedback_timestamp ON citizen_feedback(created_at DESC);

COMMENT ON TABLE citizen_feedback IS 'Citizen feedback and ratings on completed projects';

-- ============================================================================
-- TRANSPARENCY METRICS
-- ============================================================================
-- Real-time transparency dashboard metrics
CREATE TABLE transparency_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    constituency_id UUID REFERENCES constituencies(id),

    -- Disclosure Metrics
    projects_disclosed INTEGER NOT NULL DEFAULT 0,
    documents_published INTEGER NOT NULL DEFAULT 0,
    financial_reports_published INTEGER NOT NULL DEFAULT 0,

    -- Timeliness Metrics
    avg_days_to_publish_project NUMERIC(10, 2),
    avg_days_to_respond_query NUMERIC(10, 2),

    -- Engagement Metrics
    portal_visits INTEGER NOT NULL DEFAULT 0,
    unique_visitors INTEGER NOT NULL DEFAULT 0,
    document_downloads INTEGER NOT NULL DEFAULT 0,
    citizen_queries_received INTEGER NOT NULL DEFAULT 0,
    citizen_queries_responded INTEGER NOT NULL DEFAULT 0,

    -- Quality Metrics
    avg_citizen_rating NUMERIC(3, 2),
    total_feedback_submissions INTEGER NOT NULL DEFAULT 0,

    -- Compliance Score (0-100)
    transparency_score INTEGER CHECK (transparency_score BETWEEN 0 AND 100),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(metric_date, constituency_id)
);

CREATE INDEX idx_transparency_metrics_date ON transparency_metrics(metric_date DESC);
CREATE INDEX idx_transparency_metrics_constituency ON transparency_metrics(constituency_id);

COMMENT ON TABLE transparency_metrics IS 'Daily transparency and public engagement metrics';

-- ============================================================================
-- PUBLIC SEARCH QUERIES LOG
-- ============================================================================
-- Analytics on what citizens are searching for
CREATE TABLE public_search_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Search Details
    search_query TEXT NOT NULL,
    search_category VARCHAR(100),       -- 'PROJECTS', 'CONSTITUENCIES', 'FINANCIAL'

    -- Filters Applied
    filters_applied JSONB,

    -- Results
    results_count INTEGER NOT NULL,
    results_clicked JSONB,              -- Which results were clicked

    -- User Context
    user_id UUID REFERENCES users(id),  -- If authenticated
    session_id UUID,
    ip_address INET,
    user_agent TEXT,

    -- Geography
    location_country VARCHAR(2),
    location_city VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_public_search_query ON public_search_log USING gin(to_tsvector('english', search_query));
CREATE INDEX idx_public_search_timestamp ON public_search_log(created_at DESC);
CREATE INDEX idx_public_search_session ON public_search_log(session_id);

COMMENT ON TABLE public_search_log IS 'Analytics on public portal search behavior';

-- ============================================================================
-- SUBSCRIPTION ALERTS
-- ============================================================================
-- Citizens can subscribe to updates about specific constituencies or projects
CREATE TABLE public_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Subscriber
    subscriber_email VARCHAR(255) NOT NULL,
    subscriber_phone VARCHAR(20),
    subscriber_name VARCHAR(200),

    -- Subscription Type
    subscription_type VARCHAR(100) NOT NULL, -- 'CONSTITUENCY_UPDATES', 'PROJECT_UPDATES', 'WARD_UPDATES'

    -- Scope
    constituency_id UUID REFERENCES constituencies(id),
    ward_id UUID REFERENCES wards(id),
    project_id UUID REFERENCES projects(id),

    -- Preferences
    notification_frequency VARCHAR(50) NOT NULL DEFAULT 'WEEKLY', -- 'REALTIME', 'DAILY', 'WEEKLY', 'MONTHLY'
    preferred_channel notification_channel NOT NULL DEFAULT 'EMAIL',

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_token VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_notified_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_subscription_scope CHECK (
        (constituency_id IS NOT NULL) OR
        (ward_id IS NOT NULL) OR
        (project_id IS NOT NULL)
    )
);

CREATE INDEX idx_public_subs_email ON public_subscriptions(subscriber_email);
CREATE INDEX idx_public_subs_active ON public_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX idx_public_subs_constituency ON public_subscriptions(constituency_id) WHERE constituency_id IS NOT NULL;
CREATE INDEX idx_public_subs_project ON public_subscriptions(project_id) WHERE project_id IS NOT NULL;

COMMENT ON TABLE public_subscriptions IS 'Citizen subscriptions for project and constituency updates';

-- ============================================================================
-- MATERIALIZED VIEW: National Dashboard
-- ============================================================================
CREATE MATERIALIZED VIEW vw_national_dashboard AS
SELECT
    -- Time Period
    CURRENT_DATE AS snapshot_date,
    EXTRACT(YEAR FROM CURRENT_DATE) AS fiscal_year,

    -- National Totals
    COUNT(DISTINCT pp.constituency_name) AS total_constituencies,
    COUNT(pp.id) AS total_projects_published,
    SUM(pp.approved_budget) AS total_budget_allocated,
    SUM(pp.amount_disbursed) AS total_amount_disbursed,

    -- By Status
    COUNT(pp.id) FILTER (WHERE pp.status = 'COMPLETED') AS completed_projects,
    COUNT(pp.id) FILTER (WHERE pp.status = 'ACTIVE') AS active_projects,
    COUNT(pp.id) FILTER (WHERE pp.status IN ('DRAFT', 'SUBMITTED', 'UNDER_TAC_REVIEW')) AS planned_projects,

    -- By Category
    COUNT(pp.id) FILTER (WHERE pp.category = 'INFRASTRUCTURE') AS infrastructure_projects,
    COUNT(pp.id) FILTER (WHERE pp.category = 'EDUCATION') AS education_projects,
    COUNT(pp.id) FILTER (WHERE pp.category = 'HEALTH') AS health_projects,
    COUNT(pp.id) FILTER (WHERE pp.category = 'WATER_SANITATION') AS water_sanitation_projects,
    COUNT(pp.id) FILTER (WHERE pp.category = 'AGRICULTURE') AS agriculture_projects,
    COUNT(pp.id) FILTER (WHERE pp.category = 'BURSARY') AS bursary_projects,

    -- Averages
    AVG(pp.progress_percentage) AS avg_progress_percentage,

    -- Citizen Engagement
    (SELECT COUNT(*) FROM citizen_queries WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS queries_last_30_days,
    (SELECT COUNT(*) FROM citizen_feedback WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS feedback_last_30_days,
    (SELECT AVG(rating) FROM citizen_feedback WHERE is_approved = true) AS avg_citizen_rating

FROM published_projects pp
WHERE pp.is_published = true;

CREATE UNIQUE INDEX idx_vw_national_dashboard ON vw_national_dashboard(snapshot_date);

COMMENT ON MATERIALIZED VIEW vw_national_dashboard IS 'National-level aggregated statistics for public dashboard';

-- ============================================================================
-- MATERIALIZED VIEW: Constituency Rankings
-- ============================================================================
CREATE MATERIALIZED VIEW vw_constituency_rankings AS
SELECT
    pfs.constituency_id,
    pfs.constituency_name,
    pfs.fiscal_year,

    -- Financial Performance
    pfs.annual_allocation,
    pfs.total_expenditure,
    pfs.expenditure_percentage,
    RANK() OVER (PARTITION BY pfs.fiscal_year ORDER BY pfs.expenditure_percentage DESC) AS expenditure_rank,

    -- Project Performance
    pfs.total_projects,
    pfs.completed_projects,
    CASE
        WHEN pfs.total_projects > 0 THEN (pfs.completed_projects::NUMERIC / pfs.total_projects * 100)
        ELSE 0
    END AS completion_rate,
    RANK() OVER (PARTITION BY pfs.fiscal_year ORDER BY
        CASE
            WHEN pfs.total_projects > 0 THEN (pfs.completed_projects::NUMERIC / pfs.total_projects)
            ELSE 0
        END DESC
    ) AS completion_rank,

    -- Transparency Score
    tm.transparency_score,
    RANK() OVER (PARTITION BY pfs.fiscal_year ORDER BY tm.transparency_score DESC NULLS LAST) AS transparency_rank,

    -- Citizen Satisfaction
    (
        SELECT AVG(rating)
        FROM citizen_feedback cf
        JOIN published_projects pp ON cf.project_id = pp.project_id
        WHERE pp.constituency_name = pfs.constituency_name
          AND cf.is_approved = true
    ) AS avg_citizen_rating,

    -- Overall Score (composite)
    (
        COALESCE(pfs.expenditure_percentage, 0) * 0.3 +
        CASE
            WHEN pfs.total_projects > 0 THEN (pfs.completed_projects::NUMERIC / pfs.total_projects * 100)
            ELSE 0
        END * 0.3 +
        COALESCE(tm.transparency_score, 0) * 0.4
    ) AS overall_performance_score

FROM published_financial_summaries pfs
LEFT JOIN transparency_metrics tm ON pfs.constituency_id = tm.constituency_id
    AND pfs.fiscal_year = EXTRACT(YEAR FROM tm.metric_date)
WHERE pfs.quarter = 4  -- Annual summary
ORDER BY overall_performance_score DESC;

CREATE UNIQUE INDEX idx_vw_constituency_rankings ON vw_constituency_rankings(constituency_id, fiscal_year);

COMMENT ON MATERIALIZED VIEW vw_constituency_rankings IS 'Constituency performance rankings for public comparison';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-increment document download count
CREATE OR REPLACE FUNCTION increment_document_downloads()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called by application layer on download
    NEW.download_count = OLD.download_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update search keywords
CREATE OR REPLACE FUNCTION generate_search_keywords()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_keywords =
        LOWER(NEW.title) || ' ' ||
        LOWER(NEW.constituency_name) || ' ' ||
        LOWER(NEW.ward_name) || ' ' ||
        LOWER(NEW.category::TEXT);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_published_projects_search_keywords
    BEFORE INSERT OR UPDATE ON published_projects
    FOR EACH ROW
    EXECUTE FUNCTION generate_search_keywords();

-- Auto-set response SLA
CREATE OR REPLACE FUNCTION set_citizen_query_sla()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.response_due_date IS NULL THEN
        -- 5 business days SLA
        NEW.response_due_date = CURRENT_DATE + INTERVAL '5 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_citizen_queries_sla
    BEFORE INSERT ON citizen_queries
    FOR EACH ROW
    EXECUTE FUNCTION set_citizen_query_sla();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE published_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_financial_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_queries ENABLE ROW LEVEL SECURITY;

-- Published projects: Public read access for published items
CREATE POLICY published_projects_public_read ON published_projects
    FOR SELECT
    USING (is_published = true);

-- Published financial summaries: Public read access
CREATE POLICY published_finance_public_read ON published_financial_summaries
    FOR SELECT
    USING (true);  -- All published finance data is public

-- Published documents: Public read access for published items
CREATE POLICY published_docs_public_read ON published_documents
    FOR SELECT
    USING (is_published = true);

-- Citizen queries: Users can read their own queries
CREATE POLICY citizen_queries_read_own ON citizen_queries
    FOR SELECT
    USING (
        user_id = current_user_id()
        OR assigned_to = current_user_id()
        OR has_national_access()
        OR (is_public = true AND status = 'RESPONDED')
    );

-- Citizens can create queries
CREATE POLICY citizen_queries_create ON citizen_queries
    FOR INSERT
    WITH CHECK (true);  -- Anyone can submit a query

-- Only assigned users can update queries
CREATE POLICY citizen_queries_update ON citizen_queries
    FOR UPDATE
    USING (assigned_to = current_user_id() OR has_national_access());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to refresh all public materialized views
CREATE OR REPLACE FUNCTION refresh_public_portal_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vw_national_dashboard;
    REFRESH MATERIALIZED VIEW CONCURRENTLY vw_constituency_rankings;
END;
$$ LANGUAGE plpgsql;

-- Function to publish a project to public portal
CREATE OR REPLACE FUNCTION publish_project_to_portal(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
    v_project RECORD;
BEGIN
    -- Get project details with location hierarchy
    SELECT
        p.id, p.project_number, p.title, p.description, p.category,
        p.approved_budget, p.actual_cost + p.committed_amount AS amount_disbursed,
        p.balance, p.status, p.progress_percentage,
        p.cdfc_approval_date AS approval_date,
        p.actual_start_date AS start_date,
        p.expected_completion_date,
        p.actual_completion_date,
        p.estimated_beneficiaries, p.direct_jobs_created,
        c.name AS constituency_name,
        w.name AS ward_name,
        d.name AS district_name,
        prov.name AS province_name
    INTO v_project
    FROM projects p
    JOIN constituencies c ON p.constituency_id = c.id
    JOIN wards w ON p.ward_id = w.id
    JOIN districts d ON c.district_id = d.id
    JOIN provinces prov ON d.province_id = prov.id
    WHERE p.id = p_project_id
      AND p.status IN ('CDFC_APPROVED', 'PROCUREMENT', 'AWARDED', 'ACTIVE', 'COMPLETED', 'CLOSED');

    IF v_project.id IS NULL THEN
        RAISE EXCEPTION 'Project not found or not approved for publication';
    END IF;

    -- Insert or update published project
    INSERT INTO published_projects (
        project_id, project_number, title, description, category,
        constituency_name, ward_name, district_name, province_name,
        approved_budget, amount_disbursed, balance_remaining,
        status, progress_percentage,
        approval_date, start_date, expected_completion_date, actual_completion_date,
        estimated_beneficiaries, direct_jobs_created,
        is_published
    ) VALUES (
        v_project.id, v_project.project_number, v_project.title, v_project.description, v_project.category,
        v_project.constituency_name, v_project.ward_name, v_project.district_name, v_project.province_name,
        ROUND(v_project.approved_budget, 0), ROUND(v_project.amount_disbursed, 0),
        ROUND(v_project.balance, 0),
        v_project.status, v_project.progress_percentage,
        v_project.approval_date, v_project.start_date, v_project.expected_completion_date,
        v_project.actual_completion_date,
        v_project.estimated_beneficiaries, v_project.direct_jobs_created,
        true
    )
    ON CONFLICT (project_id) DO UPDATE SET
        status = EXCLUDED.status,
        progress_percentage = EXCLUDED.progress_percentage,
        amount_disbursed = EXCLUDED.amount_disbursed,
        balance_remaining = EXCLUDED.balance_remaining,
        actual_completion_date = EXCLUDED.actual_completion_date,
        last_updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION publish_project_to_portal IS 'Publishes an approved project to the public transparency portal';

-- ============================================================================
-- SCHEDULED JOBS (to be configured in application layer)
-- ============================================================================

COMMENT ON MATERIALIZED VIEW vw_national_dashboard IS 'Refresh daily at 00:00 UTC';
COMMENT ON MATERIALIZED VIEW vw_constituency_rankings IS 'Refresh daily at 01:00 UTC';

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Public API: Top performing constituencies
CREATE OR REPLACE VIEW vw_top_constituencies AS
SELECT
    constituency_name,
    fiscal_year,
    overall_performance_score,
    expenditure_percentage,
    completion_rate,
    transparency_score,
    avg_citizen_rating
FROM vw_constituency_rankings
WHERE fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY overall_performance_score DESC
LIMIT 10;

-- Public API: Recent projects
CREATE OR REPLACE VIEW vw_recent_projects AS
SELECT
    project_number,
    title,
    constituency_name,
    ward_name,
    category,
    approved_budget,
    status,
    progress_percentage,
    published_at
FROM published_projects
WHERE is_published = true
ORDER BY published_at DESC
LIMIT 50;

-- Public API: Project by category
CREATE OR REPLACE VIEW vw_projects_by_category AS
SELECT
    category,
    COUNT(*) AS total_projects,
    SUM(approved_budget) AS total_budget,
    AVG(progress_percentage) AS avg_progress,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_count,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_count
FROM published_projects
WHERE is_published = true
GROUP BY category
ORDER BY total_budget DESC;

COMMENT ON TABLE published_projects IS 'Public transparency portal - published projects';
COMMENT ON TABLE citizen_queries IS 'Public can submit queries with 5-day SLA for response';
COMMENT ON TABLE citizen_feedback IS 'Moderated citizen feedback on completed projects';
