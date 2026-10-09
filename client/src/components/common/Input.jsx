import React from 'react';

export default function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  multiline = false,
  rows = 3,
  autoComplete,
  ...props
}) {
  const inputId = id || name || Math.random().toString(36).substring(7);

  const baseClasses = `w-full px-3 py-2 text-sm border rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${
    error
      ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 text-gray-900 focus:ring-brand-500 focus:border-brand-500'
  } ${className}`;

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 select-none"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {multiline ? (
        <textarea
          id={inputId}
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseClasses}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={baseClasses}
          {...props}
        />
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}
