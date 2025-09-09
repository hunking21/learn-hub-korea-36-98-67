import bcrypt from 'bcryptjs';

// Test function to verify the admin password
export const testAdminPassword = async () => {
  const storedHash = '$2a$12$JITKSpayLm0lr1lrRhEkLe2b03p4733iyLSTJK8eGpL6JQEMSLim2';
  
  // Test common passwords
  const testPasswords = ['admin123!', 'admin', 'Admin123!', 'password', '123456'];
  
  for (const password of testPasswords) {
    const isValid = await bcrypt.compare(password, storedHash);
    console.log(`Password "${password}": ${isValid}`);
  }
};

// Call this in console to test
if (typeof window !== 'undefined') {
  (window as any).testAdminPassword = testAdminPassword;
}