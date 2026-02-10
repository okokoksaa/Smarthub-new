-- NRC normalization and validation, plus constraints and unique indexes
-- Target project: bwcqjrsuzvsqnmkznmiy

-- Helper: normalize NRC by trimming and removing spaces
create or replace function public.normalize_nrc(nrc text)
returns text
language sql
immutable
as $$
  select regexp_replace(trim(nrc), '\\s+', '', 'g')
$$;

comment on function public.normalize_nrc(text) is 'Returns a canonical NRC string with spaces removed.';

-- Helper: validate NRC format (Zambia NRC: NNNNNN/NN/N)
create or replace function public.is_valid_nrc(nrc text)
returns boolean
language plpgsql
immutable
as $$
declare
  v text;
begin
  if nrc is null then
    return false; -- use in CHECK with "col IS NULL OR is_valid_nrc(col)"
  end if;
  v := public.normalize_nrc(nrc);
  -- 6 digits / 2 digits (not 00) / 1 digit
  if v ~ '^[0-9]{6}/(0[1-9]|[1-9][0-9])/[0-9]$' then
    return true;
  else
    return false;
  end if;
end;
$$;

comment on function public.is_valid_nrc(text) is 'Validates Zambia NRC format: 6 digits, slash, 2-digit district (01-99), slash, 1 digit.';

-- Empowerment Grants: applicant_nrc must be valid and unique (normalized)
DO $$ BEGIN
  ALTER TABLE public.empowerment_grants
    ADD CONSTRAINT chk_empowerment_grants_applicant_nrc_format
    CHECK (applicant_nrc IS NULL OR public.is_valid_nrc(applicant_nrc));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_empowerment_grants_applicant_nrc_norm
  ON public.empowerment_grants (public.normalize_nrc(applicant_nrc))
  WHERE applicant_nrc IS NOT NULL;

-- Bursary Applications: student_nrc must be valid and unique (normalized)
DO $$ BEGIN
  ALTER TABLE public.bursary_applications
    ADD CONSTRAINT chk_bursary_applications_student_nrc_format
    CHECK (student_nrc IS NULL OR public.is_valid_nrc(student_nrc));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_bursary_applications_student_nrc_norm
  ON public.bursary_applications (public.normalize_nrc(student_nrc))
  WHERE student_nrc IS NOT NULL;

-- Bursary Applications: guardian_nrc must be valid (not unique; guardians may support multiple students)
DO $$ BEGIN
  ALTER TABLE public.bursary_applications
    ADD CONSTRAINT chk_bursary_applications_guardian_nrc_format
    CHECK (guardian_nrc IS NULL OR public.is_valid_nrc(guardian_nrc));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- WDC Signoffs: chair_nrc must be valid (not unique; same chair can sign multiple meetings)
DO $$ BEGIN
  ALTER TABLE public.wdc_signoffs
    ADD CONSTRAINT chk_wdc_signoffs_chair_nrc_format
    CHECK (chair_nrc IS NULL OR public.is_valid_nrc(chair_nrc));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

