-- Create the analytics view for constituency performance monitoring
CREATE OR REPLACE VIEW public.analytics_constituency_performance AS
SELECT 
  c.id AS constituency_id,
  c.name AS constituency_name,
  c.code AS constituency_code,
  d.name AS district_name,
  prov.name AS province_name,
  
  -- Project Metrics
  COALESCE(proj_stats.total_projects, 0) AS total_projects,
  COALESCE(proj_stats.active_projects, 0) AS active_projects,
  COALESCE(proj_stats.completed_projects, 0) AS completed_projects,
  
  -- Budget Metrics
  COALESCE(proj_stats.total_budget_allocated, 0) AS total_budget_allocated,
  COALESCE(pay_stats.total_funds_disbursed, 0) AS total_funds_disbursed,
  
  -- Absorption Rate: (Disbursed / Budget) * 100
  CASE 
    WHEN COALESCE(proj_stats.total_budget_allocated, 0) = 0 THEN 0
    ELSE ROUND(
      (COALESCE(pay_stats.total_funds_disbursed, 0) / proj_stats.total_budget_allocated) * 100, 
      2
    )
  END AS absorption_rate,
  
  -- Risk Metrics (from pending/submitted payments)
  COALESCE(risk_stats.risk_index, 0) AS risk_index,
  COALESCE(risk_stats.critical_alerts, 0) AS critical_alerts,
  COALESCE(risk_stats.pending_payments, 0) AS pending_payments,
  
  -- Additional Context
  c.updated_at AS last_updated

FROM public.constituencies c
LEFT JOIN public.districts d ON d.id = c.district_id
LEFT JOIN public.provinces prov ON prov.id = d.province_id

-- Project statistics subquery
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) AS total_projects,
    COUNT(*) FILTER (WHERE p.status IN ('implementation', 'approved')) AS active_projects,
    COUNT(*) FILTER (WHERE p.status = 'completed') AS completed_projects,
    COALESCE(SUM(p.budget), 0) AS total_budget_allocated
  FROM public.projects p
  WHERE p.constituency_id = c.id
) proj_stats ON true

-- Payment statistics subquery (executed payments for disbursement)
LEFT JOIN LATERAL (
  SELECT 
    COALESCE(SUM(pay.amount), 0) AS total_funds_disbursed
  FROM public.payments pay
  JOIN public.projects proj ON proj.id = pay.project_id
  WHERE proj.constituency_id = c.id
    AND pay.status = 'executed'
) pay_stats ON true

-- Risk statistics subquery (pending payments for risk analysis)
LEFT JOIN LATERAL (
  SELECT 
    ROUND(AVG(pay.ai_risk_score), 0) AS risk_index,
    COUNT(*) FILTER (WHERE pay.ai_risk_score > 75) AS critical_alerts,
    COUNT(*) AS pending_payments
  FROM public.payments pay
  JOIN public.projects proj ON proj.id = pay.project_id
  WHERE proj.constituency_id = c.id
    AND pay.status IN ('submitted', 'panel_a_pending', 'panel_b_pending', 'finance_review')
) risk_stats ON true;

-- Grant access to the view
GRANT SELECT ON public.analytics_constituency_performance TO authenticated;