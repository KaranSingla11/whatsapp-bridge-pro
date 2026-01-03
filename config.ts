/**
 * API Configuration
 * Configure the backend API base URL based on environment
 */

// Get the API base URL based on current location
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return process.env.REACT_APP_API_URL || 'http://localhost:3000';
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // For localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // For deployed applications, try to use relative path or configured URL
  // This assumes your backend is served from the same domain
  const customApiUrl = process.env.REACT_APP_API_URL;
  
  if (customApiUrl) {
    return customApiUrl;
  }

  // Default: use the same origin (frontend and backend on same domain/server)
  return `${protocol}//${hostname}`;
}

export const API_BASE = getApiBaseUrl();
