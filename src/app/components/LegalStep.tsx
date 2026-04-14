import { PropertyFormData } from '../types';
import { Zap, AlertCircle, Phone } from 'lucide-react';
import { useMemo } from 'react';
import { countries as countryList } from '@/lib/countries';

interface LegalStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  readOnly?: boolean;
  countryName?: string;
  validationErrors?: Record<string, string>;
}

export const LegalStep = ({
  listing,
  setListing,
  readOnly,
  countryName,
  validationErrors = {},
}: LegalStepProps) => {
  // Auto-detect dial code from selected country
  const dialCode = useMemo(() => {
    if (!countryName) return '+974'; // Default Qatar
    const match = countryList.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    );
    return match?.dialCode || '+974';
  }, [countryName]);

  return (
  <div className="flex flex-col gap-5">
    {/* Phone Numbers Section */}
    <div className="flex flex-col gap-5">
      <h3 className="text-base font-bold text-[#1D242B]">
        {'Contact Information'}
      </h3>

      {/* Primary Phone (WhatsApp) - Required */}
      <div className="p-[34px] border-2 border-[#F0F2F5] rounded-2xl bg-white">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#1D242B]" />
            <h4 className="text-lg font-bold text-[#1D242B]">
              {'Phone Number'}
            </h4>
            <span className="text-xs text-red-500">*</span>
          </div>
          <p className="text-sm text-[#5E5E5E] leading-[1.625]">
            {'Your WhatsApp number for guest communication'}
          </p>
          <div className="flex items-stretch mt-1">
            <div className="flex items-center px-4 bg-[#F0F2F5] border-2 border-e-0 border-[#F0F2F5] rounded-s-xl text-sm font-medium text-[#5E5E5E] select-none min-w-[80px] justify-center">
              {dialCode}
            </div>
            <input
              type="tel"
              dir="ltr"
              value={listing.phoneNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                !readOnly && setListing({ ...listing, phoneNumber: val });
              }}
              disabled={readOnly}
              placeholder="Enter phone number"
              className={`flex-1 px-4 py-3 border-2 rounded-e-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] focus:outline-none focus:border-[#FCC519] transition-colors ${
                validationErrors.phoneNumber ? 'border-red-400' : 'border-[#F0F2F5]'
              } ${readOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
          </div>
          {validationErrors.phoneNumber && (
            <p className="text-xs text-red-500">{validationErrors.phoneNumber}</p>
          )}
        </div>
      </div>

      {/* Emergency Phone - Optional */}
      <div className="p-[34px] border-2 border-[#F0F2F5] rounded-2xl bg-white">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#1D242B]" />
            <h4 className="text-lg font-bold text-[#1D242B]">
              {'Emergency Phone'}
            </h4>
            <span className="text-xs text-[#5E5E5E]">(Optional)</span>
          </div>
          <p className="text-sm text-[#5E5E5E] leading-[1.625]">
            {'A backup number for emergencies'}
          </p>
          <div className="flex items-stretch mt-1">
            <div className="flex items-center px-4 bg-[#F0F2F5] border-2 border-e-0 border-[#F0F2F5] rounded-s-xl text-sm font-medium text-[#5E5E5E] select-none min-w-[80px] justify-center">
              {dialCode}
            </div>
            <input
              type="tel"
              dir="ltr"
              value={listing.emergencyPhoneNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                !readOnly && setListing({ ...listing, emergencyPhoneNumber: val });
              }}
              disabled={readOnly}
              placeholder="Enter emergency phone number"
              className={`flex-1 px-4 py-3 border-2 border-[#F0F2F5] rounded-e-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] focus:outline-none focus:border-[#FCC519] transition-colors ${
                readOnly ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Toggle cards container */}
    <div className="flex flex-col gap-4">
      {/* Instant Book Section */}
      <div className="flex flex-col gap-5">
        <h3 className="text-base font-bold text-[#1D242B]">
          {'Booking Settings'}
        </h3>
        <div className="flex items-center justify-between p-[34px] border-2 border-[#F0F2F5] rounded-2xl bg-white">
          <div className="flex flex-col gap-1.5 pe-8">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-bold text-[#1D242B]">
                {'Instant Book'}
              </h4>
              <Zap
                className="w-4 h-4 text-[#FCC519]"
                strokeWidth={1.33}
              />
            </div>
            <p className="text-sm text-[#5E5E5E] leading-[1.625]">
              {'Allow guests to book instantly without waiting for your approval'}
            </p>
          </div>
          <button
            type="button"
            title="Toggle instant book"
            onClick={() =>
              !readOnly &&
              setListing({ ...listing, instantBook: !listing.instantBook })
            }
            disabled={readOnly}
            className={`relative min-w-[44px] max-w-[44px] min-h-[26px] max-h-[26px] rounded-full transition-colors flex-shrink-0 ${
              listing.instantBook ? 'bg-[#FCC519]' : 'bg-[#E5E9EE]'
            } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-[22px] h-[22px] bg-white rounded-full shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] transition-transform ${
                listing.instantBook
                  ? 'translate-x-[18px]'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Security & Noise Section */}
      <div className="flex flex-col gap-5">
        <h3 className="text-base font-bold text-[#1D242B]">
          {'Security & Noise'}
        </h3>
        <div className="flex items-center justify-between p-[34px] border-2 border-[#F0F2F5] rounded-2xl bg-white">
          <div className="flex flex-col gap-1.5 pe-8">
            <h4 className="text-lg font-bold text-[#1D242B]">
              {'Security Camera'}
            </h4>
            <p className="text-sm text-[#5E5E5E] leading-[1.625]">
              {'Let guests know if you have security cameras on the property'}
            </p>
          </div>
          <button
            type="button"
            title="Toggle security camera"
            onClick={() =>
              !readOnly &&
              setListing({
                ...listing,
                securityCamera: !listing.securityCamera,
              })
            }
            disabled={readOnly}
            className={`relative min-w-[44px] max-w-[44px] min-h-[26px] max-h-[26px] rounded-full transition-colors flex-shrink-0 ${
              listing.securityCamera ? 'bg-[#FCC519]' : 'bg-[#E5E9EE]'
            } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-[22px] h-[22px] bg-white rounded-full shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] transition-transform ${
                listing.securityCamera
                  ? 'translate-x-[18px]'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Noise Monitor (standalone card) */}
      <div className="flex items-center justify-between p-[34px] border-2 border-[#F0F2F5] rounded-2xl bg-white">
        <div className="flex flex-col gap-1.5 pe-8">
          <h4 className="text-lg font-bold text-[#1D242B]">
            {'Noise Monitor'}
          </h4>
          <p className="text-sm text-[#5E5E5E] leading-[1.625]">
            {'Let guests know if you have a noise monitoring device'}
          </p>
        </div>
        <button
          type="button"
          title="Toggle noise monitor"
          onClick={() =>
            !readOnly &&
            setListing({
              ...listing,
              noiseMonitor: !listing.noiseMonitor,
            })
          }
          disabled={readOnly}
          className={`relative min-w-[44px] max-w-[44px] min-h-[26px] max-h-[26px] rounded-full transition-colors flex-shrink-0 ${
            listing.noiseMonitor ? 'bg-[#FCC519]' : 'bg-[#E5E9EE]'
          } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          <span
            className={`absolute top-[2px] left-[2px] w-[22px] h-[22px] bg-white rounded-full shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] transition-transform ${
              listing.noiseMonitor
                ? 'translate-x-[18px]'
                : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>

    {/* Disclosure Warning */}
    <div className="bg-[#FCF9EE] border border-[rgba(247,232,176,0.5)] rounded-2xl p-[25px]">
      <div className="flex gap-4">
        <AlertCircle
          className="w-5 h-5 text-[#FCC519] flex-shrink-0 mt-0.5"
          strokeWidth={1.67}
        />
        <div className="flex flex-col gap-1.5">
          <h4 className="text-sm font-bold text-[#1D242B]">
            {'Important Disclosure'}
          </h4>
          <p className="text-[13px] text-[#5E5E5E] leading-[1.625]">
            {'You are required to disclose all surveillance devices on or near your property. Failure to do so may result in removal from the platform.'}
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};
