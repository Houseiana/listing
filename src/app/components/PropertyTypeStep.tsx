import { PropertyFormData } from '../types';
import { usePropertiesTypes } from '@/hooks/property/use-properties-types';

interface PropertyTypeStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  readOnly?: boolean;
  validationErrors?: Record<string, string>;
  hasAttemptedNext?: boolean;
}

export const PropertyTypeStep = ({
  listing,
  setListing,
  readOnly,
  validationErrors = {},
  hasAttemptedNext = false,
}: PropertyTypeStepProps) => {
  const { propertyTypes, loading } = usePropertiesTypes();

  if (loading) {
    return <div className="text-center py-10">{'Loading property types...'}</div>;
  }

  const hasError = hasAttemptedNext && validationErrors.propertyType;

  return (
    <div className="flex flex-col gap-4">
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">{'Property type is required'}</p>
              <p className="text-sm text-red-600 mt-1">{'Please select a property type to continue'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {propertyTypes.map((type) => {
          const normalizedListing = String(listing.propertyType).toUpperCase().replace(/ /g, '_');
          const isSelected =
            listing.propertyType === type.id ||
            String(listing.propertyType) === String(type.id) ||
            listing.propertyType === type.name?.toLowerCase().replace(/ /g, '_') ||
            normalizedListing === type.name?.toUpperCase().replace(/ /g, '_') ||
            normalizedListing === String(type.id).toUpperCase().replace(/ /g, '_');
          return (
            <button
              key={type.id}
              onClick={() =>
                !readOnly && setListing({ ...listing, propertyType: type.id })
              }
              disabled={readOnly}
              className={`h-[150px] flex flex-col items-center justify-center gap-4 rounded-3xl border-2 transition-all ${
                readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
              } ${
                isSelected
                  ? 'bg-[rgba(252,197,25,0.05)] border-[#FCC519]'
                  : 'bg-white border-[#F0F2F5] hover:border-[#E5E9EE]'
              }`}
            >
              <type.icon
                className={`w-9 h-9 ${isSelected ? 'text-[#2F3A45]' : 'text-[#5E5E5E]'}`}
                strokeWidth={1.5}
              />
              <span className={`text-[15px] font-semibold leading-tight text-center px-2 ${
                isSelected ? 'text-[#2F3A45]' : 'text-[#5E5E5E]'
              }`}>
                {type.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
