-- Add Admin User to user_profile table
-- User ID: 69a77eb2-d6c4-4f11-9a0e-574d0f7de817
-- Email: admin@daxow.com
-- Role: admin (a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4)

INSERT INTO public.user_profile (
    id,
    email,
    role_id,
    first_name,
    last_name,
    is_active,
    created_at,
    updated_at
)
VALUES (
    '69a77eb2-d6c4-4f11-9a0e-574d0f7de817'::uuid,
    'admin@daxow.com',
    'a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4'::uuid,  -- Admin role
    'Admin',
    'User',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

