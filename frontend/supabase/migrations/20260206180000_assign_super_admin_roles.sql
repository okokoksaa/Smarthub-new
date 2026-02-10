-- Migration: Assign super admin roles to jaykapambwe@gmail.com
-- This ensures the user has all necessary roles for system administration
-- Note: user_roles table already exists with role column as app_role enum type

DO $$
DECLARE
    target_user_id UUID;
    role_val public.app_role;
    roles public.app_role[] := ARRAY[
        'super_admin'::public.app_role,
        'ministry_official'::public.app_role,
        'auditor'::public.app_role,
        'plgo'::public.app_role,
        'tac_chair'::public.app_role,
        'tac_member'::public.app_role,
        'cdfc_chair'::public.app_role,
        'cdfc_member'::public.app_role,
        'finance_officer'::public.app_role,
        'wdc_member'::public.app_role,
        'mp'::public.app_role
    ];
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'jaykapambwe@gmail.com'
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User jaykapambwe@gmail.com not found in auth.users';
        RETURN;
    END IF;

    RAISE NOTICE 'Found user ID: %', target_user_id;

    -- Ensure profile exists
    INSERT INTO public.profiles (id, email, first_name, last_name, is_active)
    VALUES (target_user_id, 'jaykapambwe@gmail.com', 'Joseph', 'Kapambwe', true)
    ON CONFLICT (id) DO UPDATE SET is_active = true;

    RAISE NOTICE 'Profile ensured for user';

    -- Assign all roles (table already exists with app_role enum type)
    FOREACH role_val IN ARRAY roles
    LOOP
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, role_val)
        ON CONFLICT (user_id, role) DO NOTHING;
        RAISE NOTICE 'Assigned role: %', role_val;
    END LOOP;

    RAISE NOTICE 'All roles assigned successfully to jaykapambwe@gmail.com';
END $$;
