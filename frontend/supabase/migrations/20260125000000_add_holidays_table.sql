-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 2026 Zambian holidays
INSERT INTO holidays (date, name) VALUES
    ('2026-01-01', 'New Year''s Day'),
    ('2026-03-12', 'Youth Day'),
    ('2026-04-03', 'Good Friday'),
    ('2026-04-04', 'Holy Saturday'),
    ('2026-04-06', 'Easter Monday'),
    ('2026-05-01', 'Labour Day'),
    ('2026-05-25', 'Africa Day'),
    ('2026-07-06', 'Heroes'' Day'),
    ('2026-07-07', 'Unity Day'),
    ('2026-08-03', 'Farmers'' Day'),
    ('2026-10-24', 'Independence Day'),
    ('2026-12-25', 'Christmas Day')
ON CONFLICT (date) DO NOTHING;

-- Create is_working_day function
CREATE OR REPLACE FUNCTION is_working_day(check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
    -- Return FALSE for weekends (Saturday = 6, Sunday = 0)
    IF EXTRACT(DOW FROM check_date) IN (0, 6) THEN
        RETURN FALSE;
    END IF;

    -- Return FALSE if the date is a holiday
    IF EXISTS (SELECT 1 FROM holidays WHERE date = check_date) THEN
        RETURN FALSE;
    END IF;

    -- Otherwise it's a working day
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION is_working_day(DATE) IS 'Returns TRUE if the given date is a working day (not a weekend or Zambian public holiday), FALSE otherwise';
