-- Update admin password to ensure it's "admin123!"
UPDATE users 
SET password_hash = '$2a$12$8Yj/gHfzZFe8qKZQgRBPa.kH7xTvEKJqWYxM8KXy5kqvz7rO0e0gG'
WHERE username = 'admin';