import React, { useState } from 'react';

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
  '2xl': 'w-32 h-32 text-3xl',
};

export default function Avatar({
  src,
  name = 'User',
  size = 'md',
  className = '',
  alt,
}) {
  const [hasError, setHasError] = useState(false);

  const getInitials = (str) => {
    if (!str || typeof str !== 'string') return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const sizeClass = sizeMap[size] || sizeMap.md;

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        onError={() => setHasError(true)}
        className={`rounded-full object-cover flex-shrink-0 border border-gray-200 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`rounded-full bg-gradient-to-tr from-brand-600 to-blue-500 text-white font-semibold flex items-center justify-center flex-shrink-0 shadow-sm border border-brand-200 ${sizeClass} ${className}`}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
}
