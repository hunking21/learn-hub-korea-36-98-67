/**
 * Utility to clean up authentication state and prevent limbo states
 * during login/logout processes
 */
export const cleanupAuthState = () => {
  try {
    // Remove TN Academy specific session tokens
    localStorage.removeItem('tn_academy_session_token');
    localStorage.removeItem('auth_session_v1');
    localStorage.removeItem('mock_session');
    
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('Auth state cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up auth state:', error);
  }
};