-- Reset admin password to 'admin123'
-- First, generate a new bcrypt hash for 'admin123'
UPDATE users 
SET password_hash = '$2a$12$LQv3c1yqBwEHXVn4fUztAOHrGdx3p8f6DJKmtqJMWCCdJ.4LfUj8W'
WHERE username = 'admin';

-- If admin doesn't exist, create it
INSERT INTO users (username, password_hash, full_name, role, is_active)
VALUES ('admin', '$2a$12$LQv3c1yqBwEHXVn4fUztAOHrGdx3p8f6DJKmtqJMWCCdJ.4LfUj8W', 'TN Academy 관리자', 'admin', true)
ON CONFLICT (username) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  is_active = true;