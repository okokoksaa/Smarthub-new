-- Add residency verification fields to wdc_signoffs table
ALTER TABLE public.wdc_signoffs
ADD COLUMN residency_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN residency_verified_by TEXT,
ADD COLUMN residency_verification_method TEXT,
ADD COLUMN residents_count INTEGER,
ADD COLUMN non_residents_count INTEGER DEFAULT 0,
ADD COLUMN residency_threshold_met BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN residency_notes TEXT;