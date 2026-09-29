/** Resolve image URLs — prefer local /uploads (fast) over external CDN */
export function mediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return url;
  if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) return url;
  return url;
}

export function isExternalCdn(url) {
  if (!url) return false;
  return /instagram|fbcdn|facebook\.com/i.test(url);
}
