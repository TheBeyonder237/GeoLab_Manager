import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Calendar,
  Clock,
  Upload,
  X,
  Plus,
  Trash2
} from 'lucide-react';

const fieldVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2
    }
  }
};

const Field = ({
  type,
  name,
  label,
  value,
  onChange,
  error,
  options = [],
  placeholder,
  required,
  disabled,
  min,
  max,
  step,
  multiple,
  accept,
  rows,
  className = '',
  theme = 'light',
  validation,
  hint,
  prefix,
  suffix,
  icon: Icon,
  onBlur,
  onFocus
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [files, setFiles] = useState([]);

  const handleFocus = (e) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  const baseClasses = `
    w-full px-3 py-2 rounded-lg transition-colors
    ${theme === 'light'
      ? 'bg-white border focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
      : 'bg-gray-800 border-gray-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-400'
    }
    ${error
      ? 'border-red-500'
      : theme === 'light'
        ? 'border-gray-300'
        : 'border-gray-700'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  const renderField = () => {
    switch (type) {
      case 'select':
        return (
          <div className="relative">
            <select
              name={name}
              value={value}
              onChange={onChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              required={required}
              className={`${baseClasses} appearance-none pr-10`}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        );

      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={rows || 4}
            className={baseClasses}
          />
        );

      case 'file':
        return (
          <div className="space-y-2">
            <div
              className={`
                ${baseClasses}
                flex items-center justify-center cursor-pointer
                ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'}
              `}
              onClick={() => document.getElementById(name).click()}
            >
              <input
                id={name}
                type="file"
                name={name}
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files);
                  setFiles(prev => [...prev, ...newFiles]);
                  onChange({
                    target: {
                      name,
                      value: multiple ? [...value, ...newFiles] : newFiles[0]
                    }
                  });
                }}
                className="hidden"
                multiple={multiple}
                accept={accept}
              />
              <div className="text-center py-4">
                <Upload className={`w-8 h-8 mx-auto mb-2 ${
                  theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                  Glissez-déposez vos fichiers ici ou cliquez pour parcourir
                </p>
              </div>
            </div>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className={`
                      flex items-center justify-between p-2 rounded-lg
                      ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}
                    `}
                  >
                    <span className={
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = files.filter((_, i) => i !== index);
                        setFiles(newFiles);
                        onChange({
                          target: {
                            name,
                            value: multiple ? newFiles : newFiles[0]
                          }
                        });
                      }}
                      className={`p-1 rounded-full hover:bg-gray-200 ${
                        theme === 'light'
                          ? 'text-gray-500 hover:text-gray-700'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'date':
      case 'time':
      case 'datetime-local':
        return (
          <div className="relative">
            <input
              type={type}
              name={name}
              value={value}
              onChange={onChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              min={min}
              max={max}
              className={`${baseClasses} pl-10`}
            />
            {type === 'date' && (
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            )}
            {(type === 'time' || type === 'datetime-local') && (
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            )}
          </div>
        );

      default:
        return (
          <div className="relative">
            {prefix && (
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {prefix}
              </span>
            )}
            <input
              type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
              name={name}
              value={value}
              onChange={onChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              min={min}
              max={max}
              step={step}
              className={`
                ${baseClasses}
                ${prefix ? 'pl-8' : ''}
                ${suffix ? 'pr-8' : ''}
                ${Icon ? 'pl-10' : ''}
              `}
            />
            {Icon && (
              <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            )}
            {suffix && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {suffix}
              </span>
            )}
          </div>
        );
    }
  };

  return (
    <motion.div
      variants={fieldVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-1"
    >
      {label && (
        <label
          htmlFor={name}
          className={`block text-sm font-medium ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderField()}
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-1 mt-1"
          >
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-500">{error}</span>
          </motion.div>
        )}
        
        {hint && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-xs ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            {hint}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function DynamicForm({
  fields,
  values,
  onChange,
  onSubmit,
  errors = {},
  loading = false,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  onCancel,
  theme = 'light'
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <Field
            key={field.name}
            {...field}
            value={values[field.name]}
            onChange={onChange}
            error={errors[field.name]}
            theme={theme}
          />
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`
              px-4 py-2 rounded-lg
              ${theme === 'light'
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`
            px-4 py-2 rounded-lg bg-blue-600 text-white
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
          `}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Chargement...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
