import React from 'react';

const variantClasses = {
  primary:
    'bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-sm focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
  secondary:
    'bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
  outline:
    'border border-brand-600 text-brand-600 hover:bg-brand-50 font-medium focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
  danger:
    'bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  ghost:
    'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium focus:ring-2 focus:ring-gray-300',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-md',
  lg: 'px-6 py-2.5 text-base rounded-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  icon = null,
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center transition-colors duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClass = variantClasses[variant] || variantClasses.primary;
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        <>
          {icon && <span className="mr-2 flex items-center">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
