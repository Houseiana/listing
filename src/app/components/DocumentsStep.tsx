import { PropertyFormData } from '../types';
import { Upload, X, CheckCircle, Building2, User } from 'lucide-react';

interface DocumentsStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  readOnly?: boolean;
}

export const DocumentsStep = ({
  listing,
  setListing,
  readOnly,
}: DocumentsStepProps) => {
  const handleFileChange = (
    field: keyof typeof listing.documentOfProperty,
    file: File | null
  ) => {
    setListing({
      ...listing,
      documentOfProperty: {
        ...listing.documentOfProperty,
        [field]: file,
      },
    });
  };

  const renderUploadBox = (
    field: keyof typeof listing.documentOfProperty,
    label: string,
    description: string,
    optional = false
  ) => {
    const file = listing.documentOfProperty[field];
    const isFile = file instanceof File;
    const isUrl = typeof file === 'string' && file.length > 0;
    const hasDocument = isFile || isUrl;

    // Extract display info
    const fileName = isFile
      ? file.name
      : isUrl
        ? decodeURIComponent(file.split('/').pop()?.split('?')[0] || label)
        : '';
    const fileSize = isFile ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '';

    return (
      <div className="border-2 border-[#F0F2F5] rounded-2xl pt-[34px] px-[34px] pb-[2px] flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-[17px] font-bold text-[#1D242B]">
            {label}
            {optional && <span className="text-sm font-normal text-[#9CA3AF] ms-2">Optional</span>}
          </h3>
          <p className="text-sm text-[#5E5E5E]">{description}</p>
        </div>

        {hasDocument ? (
          <div className="flex items-center justify-between p-5 bg-[rgba(252,197,25,0.02)] border-2 border-[#FCC519] rounded-2xl mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#FCC519]" />
              <div>
                <p className="text-sm font-semibold text-[#1D242B] truncate max-w-[200px]">
                  {isUrl ? (
                    <a href={file} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#FCC519]">
                      {fileName}
                    </a>
                  ) : (
                    fileName
                  )}
                </p>
                {fileSize && (
                  <p className="text-xs text-[#5E5E5E]">{fileSize}</p>
                )}
                {isUrl && (
                  <p className="text-xs text-[#9CA3AF]">{"Uploaded previously"}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleFileChange(field, null)}
              disabled={readOnly}
              title={`Remove ${label}`}
              className={`p-1.5 rounded-full transition-colors ${
                readOnly
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-gray-100'
              }`}
            >
              <X className="w-4 h-4 text-[#1D242B]" />
            </button>
          </div>
        ) : (
          <label
            className={`flex flex-col items-center justify-center h-[167px] border-2 border-dashed border-[#F0F2F5] rounded-2xl transition-colors ${
              readOnly
                ? 'cursor-not-allowed bg-gray-50'
                : 'cursor-pointer hover:border-[#FCC519]'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-[#F8F9FA] rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-[#9CA3AF]" strokeWidth={2} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-semibold text-[#1D242B] text-center">
                  {'Click to upload'}
                </p>
                <p className="text-xs text-[#9CA3AF] text-center">
                  {'PDF, JPG, JPEG, or PNG'}
                </p>
              </div>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={readOnly}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(field, e.target.files[0]);
                }
              }}
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base font-bold text-[#1D242B]">
        {'Upload your property documents'}
      </p>

      <div className="flex flex-col gap-6">
        {/* Managed By toggle */}
        <div className="border-2 border-[#F0F2F5] rounded-2xl px-[34px] py-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 pr-4">
              <div className="flex items-center gap-2">
                {listing.managedBy ? (
                  <Building2 className="w-4 h-4 text-[#1D242B]" />
                ) : (
                  <User className="w-4 h-4 text-[#1D242B]" />
                )}
                <h3 className="text-[17px] font-bold text-[#1D242B]">
                  {listing.managedBy ? 'Hosted by Houseiana' : 'Hosted by owner'}
                </h3>
              </div>
              <p className="text-sm text-[#5E5E5E]">
                {'Switch on to let Houseiana manage and host this property for you'}
              </p>
            </div>
            <button
              type="button"
              title="Toggle managed by"
              onClick={() =>
                !readOnly &&
                setListing({
                  ...listing,
                  managedBy: !listing.managedBy,
                })
              }
              disabled={readOnly}
              className={`relative min-w-[44px] max-w-[44px] min-h-[26px] max-h-[26px] rounded-full transition-colors flex-shrink-0 ${
                listing.managedBy ? 'bg-[#FCC519]' : 'bg-[#E5E9EE]'
              } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              <span
                className={`absolute top-[2px] left-[2px] w-[22px] h-[22px] bg-white rounded-full shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] transition-transform ${
                  listing.managedBy ? 'translate-x-[18px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div className="bg-[#FCF9EE] border border-[rgba(247,232,176,0.5)] rounded-xl p-4">
            <p className="text-[13px] text-[#5E5E5E] leading-[1.625]">
              {listing.managedBy
                ? 'Houseiana team will handle guest communication, check-in, cleaning, and day-to-day operations on your behalf.'
                : 'You (the owner) will handle guest communication, check-in, and day-to-day operations yourself.'}
            </p>
          </div>
        </div>

        {renderUploadBox(
          'PrpopertyDocoument',
          'Property Document',
          'Upload your property ownership or lease document',
          true
        )}

        {renderUploadBox(
          'HostId',
          'Host ID',
          'Upload a valid government-issued ID',
          true
        )}

        <div className="border-2 border-[#F0F2F5] rounded-2xl px-[34px] py-6 flex items-center justify-between">
          <div className="flex flex-col gap-1 pr-4">
            <h3 className="text-[17px] font-bold text-[#1D242B]">
              {'Are you the property owner?'}
            </h3>
            <p className="text-sm text-[#5E5E5E]">
              {'If not, you will need to upload a power of attorney'}
            </p>
          </div>
          <button
            type="button"
            title="Toggle property owner"
            onClick={() =>
              !readOnly &&
              setListing({
                ...listing,
                isPropertyOwner: !listing.isPropertyOwner,
              })
            }
            disabled={readOnly}
            className={`relative min-w-[44px] max-w-[44px] min-h-[26px] max-h-[26px] rounded-full transition-colors flex-shrink-0 ${
              listing.isPropertyOwner ? 'bg-[#FCC519]' : 'bg-[#E5E9EE]'
            } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-[22px] h-[22px] bg-white rounded-full shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] transition-transform ${
                listing.isPropertyOwner
                  ? 'translate-x-[18px]'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {!listing.isPropertyOwner &&
          renderUploadBox(
            'PowerOfAttorney',
            'Power of Attorney',
            'Upload the power of attorney document authorizing you to manage this property'
          )}
      </div>
    </div>
  );
};
