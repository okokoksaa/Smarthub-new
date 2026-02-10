-- Add document_id column to payments table for linking to supporting documents
ALTER TABLE public.payments 
ADD COLUMN document_id UUID REFERENCES public.documents(id);

-- Create composite type for payment submission result
CREATE TYPE public.payment_submission_result AS (
  success BOOLEAN,
  payment_id UUID,
  payment_number TEXT,
  risk_score INTEGER,
  risk_level TEXT,
  error_message TEXT
);

-- Create the submit_payment_request RPC function
CREATE OR REPLACE FUNCTION public.submit_payment_request(
  p_project_id UUID,
  p_amount NUMERIC,
  p_document_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_milestone TEXT DEFAULT NULL,
  p_beneficiary_name TEXT DEFAULT NULL
)
RETURNS public.payment_submission_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.payment_submission_result;
  v_project RECORD;
  v_total_spent NUMERIC;
  v_remaining_budget NUMERIC;
  v_risk_score INTEGER;
  v_risk_level TEXT;
  v_payment_number TEXT;
  v_new_payment_id UUID;
BEGIN
  -- Initialize result
  v_result.success := FALSE;
  
  -- Check if project exists and get project details
  SELECT p.*, c.name as contractor_name
  INTO v_project
  FROM projects p
  LEFT JOIN contractors c ON c.id = p.contractor_id
  WHERE p.id = p_project_id;
  
  IF v_project.id IS NULL THEN
    v_result.error_message := 'Project not found';
    RETURN v_result;
  END IF;
  
  -- Check if project is in a valid status for payments
  IF v_project.status NOT IN ('approved', 'implementation') THEN
    v_result.error_message := 'Project must be approved or in implementation to receive payments';
    RETURN v_result;
  END IF;
  
  -- Calculate total spent on this project
  SELECT COALESCE(SUM(amount), 0) INTO v_total_spent
  FROM payments
  WHERE project_id = p_project_id
    AND status NOT IN ('rejected');
  
  -- Calculate remaining budget
  v_remaining_budget := v_project.budget - v_total_spent;
  
  -- Check if payment amount exceeds remaining budget
  IF p_amount > v_remaining_budget THEN
    v_result.error_message := 'Payment amount (' || p_amount || ') exceeds remaining project budget (' || v_remaining_budget || ')';
    RETURN v_result;
  END IF;
  
  -- Simulated AI Analysis for risk scoring
  -- In production, this would call an external AI service
  IF p_amount > 100000 THEN
    v_risk_score := 75;
    v_risk_level := 'high';
  ELSIF p_amount > 50000 THEN
    v_risk_score := 35;
    v_risk_level := 'medium';
  ELSE
    v_risk_score := 10;
    v_risk_level := 'low';
  END IF;
  
  -- Additional risk factor: high percentage of remaining budget
  IF p_amount > (v_remaining_budget * 0.5) AND v_remaining_budget > 0 THEN
    v_risk_score := LEAST(100, v_risk_score + 20);
    IF v_risk_score > 50 THEN
      v_risk_level := 'high';
    END IF;
  END IF;
  
  -- Generate payment number
  v_payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(
    (SELECT COALESCE(COUNT(*), 0) + 1 FROM payments WHERE created_at >= DATE_TRUNC('year', NOW()))::TEXT,
    6, '0'
  );
  
  -- Insert the payment record
  INSERT INTO payments (
    payment_number,
    project_id,
    amount,
    description,
    milestone,
    beneficiary_name,
    document_id,
    status,
    ai_risk_score,
    ai_risk_level,
    ai_flags,
    created_by
  ) VALUES (
    v_payment_number,
    p_project_id,
    p_amount,
    p_description,
    p_milestone,
    COALESCE(p_beneficiary_name, v_project.contractor_name, 'Contractor'),
    p_document_id,
    'submitted',
    v_risk_score,
    v_risk_level::risk_level,
    CASE 
      WHEN v_risk_score > 50 THEN '["Amount exceeds threshold for automatic review"]'::jsonb
      ELSE '[]'::jsonb
    END,
    auth.uid()
  )
  RETURNING id INTO v_new_payment_id;
  
  -- Return success result
  v_result.success := TRUE;
  v_result.payment_id := v_new_payment_id;
  v_result.payment_number := v_payment_number;
  v_result.risk_score := v_risk_score;
  v_result.risk_level := v_risk_level;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_payment_request TO authenticated;

-- Add 'submitted' to payment_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'submitted' AND enumtypid = 'public.payment_status'::regtype) THEN
    ALTER TYPE public.payment_status ADD VALUE 'submitted';
  END IF;
END $$;