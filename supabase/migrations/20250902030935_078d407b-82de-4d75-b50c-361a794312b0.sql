-- Generate the correct bcrypt hash for "admin123!" 
-- Using bcrypt with cost factor 12
UPDATE users 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QQhBT9i'
WHERE username = 'admin';