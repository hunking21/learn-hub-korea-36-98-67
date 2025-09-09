-- Update test account passwords with proper bcrypt hashes
-- Reset admin password to 'admin123!'
UPDATE users 
SET password_hash = '$2a$12$Lw7Y.1YU8zvl8LnEjZE8rOGK.6SLWQsX/gK.FVYDQWEf0mKgYlwCe'
WHERE username = 'admin';

-- Reset teacher password to 'teacher123!'  
UPDATE users 
SET password_hash = '$2a$12$8FLKgz9mZ3vGa5.dQR7XL.rKd2PnEO8vF7JZxHwRnGxK9jNtYmKLa'
WHERE username = 'teacher';

-- Reset student password to 'student123!'
UPDATE users 
SET password_hash = '$2a$12$Q3ZwEoF6xRnGc4.6WJcYXe7HgJjfLnI2wQ1MmVxBzCkGjOeR8yNpK'
WHERE username = 'student';