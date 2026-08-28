/**
 * Formats image URLs safely to display both remote (Cloudinary) and local backend images.
 */
export const getImageUrl = (url?: string, fallback = '/assets/rentora-logo.png'): string => {
  if (!url) return fallback;

  // Absolute HTTP/HTTPS or Base64 data URLs
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // Relative URLs (e.g. /uploads/img_....jpg) -> resolve against backend origin
  const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5001/api';
  const backendBase = apiUrl.replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;

  return `${backendBase}${cleanPath}`;
};

export const getAvatarUrl = (url?: string, fullName = 'User'): string => {
  if (!url || url === 'data:,' || url.trim() === '') {
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`;
  }
  return getImageUrl(url);
};

export default getImageUrl;
