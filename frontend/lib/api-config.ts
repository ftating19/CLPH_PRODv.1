// API Configuration
// This uses the environment variable with a fallback for local development
export const API_BASE_URL = apiUrl('');

// Helper function to build API URLs
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

// Export for convenience
export default API_BASE_URL;
