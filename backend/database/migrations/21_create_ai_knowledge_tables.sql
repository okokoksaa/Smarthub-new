-- =====================================================
-- 21: AI Knowledge Center tables (Phase 1)
-- =====================================================

CREATE TABLE IF NOT EXISTS knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('act', 'guideline', 'circular')),
    version_label VARCHAR(50),
    effective_date DATE,
    document_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_knowledge_sources_title_version
    ON knowledge_sources(title, COALESCE(version_label, ''));
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_type_active
    ON knowledge_sources(source_type, is_active);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    section_label VARCHAR(200),
    chunk_order INTEGER NOT NULL DEFAULT 0,
    chunk_text TEXT NOT NULL,
    token_count INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(chunk_text, ''))) STORED
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_knowledge_chunks_source_order
    ON knowledge_chunks(source_id, chunk_order);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source
    ON knowledge_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_active
    ON knowledge_chunks(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_search
    ON knowledge_chunks USING GIN(search_vector);

CREATE TRIGGER trg_knowledge_sources_updated_at
    BEFORE UPDATE ON knowledge_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_knowledge_chunks_updated_at
    BEFORE UPDATE ON knowledge_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE knowledge_sources IS 'Indexed policy source registry for AI Knowledge Center (CDF Act, Guidelines, Circulars)';
COMMENT ON TABLE knowledge_chunks IS 'Chunked policy passages used for retrieval and citation-backed responses';
