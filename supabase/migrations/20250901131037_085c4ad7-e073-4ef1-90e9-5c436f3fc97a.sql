-- Fix RLS policies for test_masters to properly validate session tokens
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage test masters" ON test_masters;
DROP POLICY IF EXISTS "Admins and teachers can view all test masters" ON test_masters;

-- Create updated policies with proper session token validation
CREATE POLICY "Admins can manage test masters" 
ON test_masters
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = COALESCE(
            current_setting('app.session_token', true),
            (current_setting('request.jwt.claims', true)::json ->> 'session_token')
        )
        AND s.expires_at > now()
        AND u.role = 'admin'
        AND u.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = COALESCE(
            current_setting('app.session_token', true),
            (current_setting('request.jwt.claims', true)::json ->> 'session_token')
        )
        AND s.expires_at > now()
        AND u.role = 'admin'
        AND u.is_active = true
    )
);

CREATE POLICY "Admins and teachers can view all test masters"
ON test_masters
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = COALESCE(
            current_setting('app.session_token', true),
            (current_setting('request.jwt.claims', true)::json ->> 'session_token')
        )
        AND s.expires_at > now()
        AND u.role IN ('admin', 'teacher')
        AND u.is_active = true
    )
);