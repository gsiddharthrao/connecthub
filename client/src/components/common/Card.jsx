import React from 'react';

export default function Card({
  children,
  header = null,
  footer = null,
  className = '',
  noPadding = false,
  hover = false,
  ...props
}) {
  const hoverClass = hover ? 'transition-shadow duration-200 hover:shadow-md' : '';

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${hoverClass} ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-600">
          {footer}
        </div>
      )}
    </div>
  );
}
