import { useState } from 'react';
import { mediaUrl, isExternalCdn } from '../utils/mediaUrl';

const FALLBACK = '/uploads/branding/school-logo.jpg';

export default function SafeImage({ src, alt, className, ...props }) {
  const [err, setErr] = useState(false);
  const resolved = mediaUrl(src);
  const useSrc = err || !resolved ? FALLBACK : resolved;

  return (
    <img
      src={useSrc}
      alt={alt || ''}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy={isExternalCdn(resolved) ? 'no-referrer' : undefined}
      onError={() => setErr(true)}
      {...props}
    />
  );
}
