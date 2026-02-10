CREATE TABLE public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL UNIQUE,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Zambian holidays for 2026
INSERT INTO public_holidays (name, date, is_recurring) VALUES
('New Year''s Day', '2026-01-01', true),
('Youth Day', '2026-03-12', true),
('Good Friday', '2026-04-03', false),
('Easter Monday', '2026-04-06', false),
('Labour Day', '2026-05-01', true),
('Africa Day', '2026-05-25', true),
('Heroes Day', '2026-07-06', true),
('Unity Day', '2026-07-07', true),
('Farmers Day', '2026-08-03', true),
('National Prayer Day', '2026-10-18', true),
('Independence Day', '2026-10-24', true),
('Christmas Day', '2026-12-25', true);
