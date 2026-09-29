import { useState } from 'react';

export default function SchoolLogo({ logoUrl, size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false);
  const sizes = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-[4.5rem] h-[4.5rem]',
  };
  const src = logoUrl && !failed ? logoUrl : '/uploads/branding/school-logo.jpg';

  return (
    <img
      src={src}
      alt="Nayab English Grammar High School"
      className={`${sizes[size]} rounded-full object-contain bg-white border-2 border-gold/60 shadow-sm shrink-0 ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
