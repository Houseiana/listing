interface ValidationErrorProps {
  message: string;
  description?: string;
}

export function ValidationError({ message, description }: ValidationErrorProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
      <div className="flex items-start gap-2">
        <svg
          className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-red-800">{message}</p>
          {description && (
            <p className="text-sm text-red-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface RequiredFieldLabelProps {
  label: string;
  required?: boolean;
}

export function RequiredFieldLabel({
  label,
  required = true,
}: RequiredFieldLabelProps) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}
