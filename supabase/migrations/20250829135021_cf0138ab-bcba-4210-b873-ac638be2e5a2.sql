-- Update default users with properly hashed passwords
-- Note: In a real application, these should be changed immediately after first login

-- Hash for 'admin123!' 
UPDATE public.users 
SET password_hash = '$2a$12$WQzE8K.0OFN8jF3v7oW3POZyh7LZr5OjVEYyOdY8GCiXUaW9RWcgG'
WHERE username = 'admin';

-- Hash for 'teacher123!'
UPDATE public.users 
SET password_hash = '$2a$12$ZCYhjKMB8JkpB4LzW/jtseZ6vGaGOo1WgFz3lEUxsqgAZMZw4AoTm'
WHERE username = 'teacher';

-- Hash for 'student123!'
UPDATE public.users 
SET password_hash = '$2a$12$kKmX9sKBm8vF2gkWRqRMXOuD7/SqD6cYhWBY3BM3lGOYhC5jtJlXi'
WHERE username = 'student';