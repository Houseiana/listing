import { PropertyFormData } from '../types';
import { Zap, AlertCircle, Phone, CalendarDays } from 'lucide-react';
import { useMemo } from 'react';
import { countries as countryList } from '@/lib/countries';
import { blockArabicNumeralKey, stripArabicNumerals } from '@/lib/utils/numeric-input';
import { useTranslation } from '@/lib/i18n/context';

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
  const { t } = useTranslation();
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
        {t('addListing.legal.contactInformation')}
      </h3>

      {/* Primary Phone (WhatsApp) - Required */}
      <div className="p-[34px] border-2 border-[#F0F2F5] rounded-2xl bg-white">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#1D242B]" />
            <h4 className="text-lg font-bold text-[#1D242B]">
              {t('addListing.legal.phoneNumber')}
            </h4>
            <span className="text-xs text-red-500">*</span>
          </div>
          <p className="text-sm text-[#5E5E5E] leading-[1.625]">
            {t('addListing.legal.phoneNumberHint')}
          </p>
          <div className="flex items-stretch mt-1">
            <div className="flex items-center px-4 bg-[#F0F2F5] border-2 border-e-0 border-[#F0F2F5] rounded-s-xl text-sm font-medium text-[#5E5E5E] select-none min-w-[80px] justify-center">
              {dialCode}
            </div>
            <input
              type="tel"
              dir="ltr"
              value={listing.phoneNumber}
              onKeyDown={blockArabicNumeralKey}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                !readOnly && setListing({ ...listing, phoneNumber: val });
              }}
              disabled={readOnly}
              placeholder={t('addListing.legal.enterPhoneNumber')}
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
              {t('addListing.legal.emergencyPhone')}
            </h4>
            <span className="text-xs text-[#5E5E5E]">{t('addListing.legal.optionalParens')}</span>
          </div>
          <p className="text-sm text-[#5E5E5E] leading-[1.625]">
            {t('addListing.legal.emergencyPhoneHint')}
          </p>
          <div className="flex items-stretch mt-1">
            <div className="flex items-center px-4 bg-[#F0F2F5] border-2 border-e-0 border-[#F0F2F5] rounded-s-xl text-sm font-medium text-[#5E5E5E] select-none min-w-[80px] justify-center">
              {dialCode}
            </div>
            <input
              type="tel"
              dir="ltr"
              value={listing.emergencyPhoneNumber}
              onKeyDown={blockArabicNumeralKey}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                !readOnly && setListing({ ...listing, emergencyPhoneNumber: val });
              }}
              disabled={readOnly}
              placeholder={t('addListing.legal.enterEmergencyPhoneNumber')}
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
          {t('addListing.legal.bookingSettings')}
        </h3>
        <div className="flex items-center justify-between p-[34px] border-2 border-[#F0F2F5] rounded-2xl bg-white">
          <div className="flex flex-col gap-1.5 pe-8">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-bold text-[#1D242B]">
                {t('addListing.legal.instantBook')}
              </h4>
              <Zap
                className="w-4 h-4 text-[#FCC519]"
                strokeWidth={1.33}
              />
            </div>
            <p className="text-sm text-[#5E5E5E] leading-[1.625]">
              {t('addListing.legal.instantBookHint')}
            </p>
          </div>
          <button
            type="button"
            title={t('addListing.legal.toggleInstantBook')}
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

        {/* Minimum Days For Booking */}
        <div className="p-[34px] border-2 border-[#F0F2F5] rounded-2xl bg-white">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#1D242B]" />
              <h4 className="text-lg font-bold text-[#1D242B]">
                {t('addListing.legal.minimumDaysForBooking')}
              </h4>
            </div>
            <p className="text-sm text-[#5E5E5E] leading-[1.625]">
              {t('addListing.legal.minimumDaysHint')}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                title={t('addListing.legal.decreaseMinimumDays')}
                onClick={() => {
                  if (readOnly) return;
                  const current = Number(listing.minimumDaysForBooking) || 1;
                  const next = Math.max(1, current - 1);
                  setListing({ ...listing, minimumDaysForBooking: next });
                }}
                disabled={readOnly || (Number(listing.minimumDaysForBooking) || 1) <= 1}
                className={`w-10 h-10 rounded-full border-2 border-[#F0F2F5] text-[#1D242B] text-lg font-bold flex items-center justify-center transition-colors ${
                  readOnly || (Number(listing.minimumDaysForBooking) || 1) <= 1
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:border-[#FCC519]'
                }`}
              >
                {'−'}
              </button>
              <input
                type="number"
                min={1}
                dir="ltr"
                value={listing.minimumDaysForBooking ?? 1}
                onKeyDown={blockArabicNumeralKey}
                onChange={(e) => {
                  if (readOnly) return;
                  const raw = stripArabicNumerals(e.target.value).replace(/[^0-9]/g, '');
                  const parsed = parseInt(raw, 10);
                  const next = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
                  setListing({ ...listing, minimumDaysForBooking: next });
                }}
                disabled={readOnly}
                placeholder="1"
                className={`w-24 text-center px-4 py-3 border-2 rounded-xl text-sm font-medium text-[#1D242B] placeholder:text-[#B0B8C1] focus:outline-none focus:border-[#FCC519] transition-colors border-[#F0F2F5] ${
                  readOnly ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <button
                type="button"
                title={t('addListing.legal.increaseMinimumDays')}
                onClick={() => {
                  if (readOnly) return;
                  const current = Number(listing.minimumDaysForBooking) || 1;
                  setListing({ ...listing, minimumDaysForBooking: current + 1 });
                }}
                disabled={readOnly}
                className={`w-10 h-10 rounded-full border-2 border-[#F0F2F5] text-[#1D242B] text-lg font-bold flex items-center justify-center transition-colors ${
                  readOnly ? 'cursor-not-allowed opacity-50' : 'hover:border-[#FCC519]'
                }`}
              >
                {'+'}
              </button>
              <span className="text-sm text-[#5E5E5E]">{t('addListing.legal.nights')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Noise Section */}
      <div className="flex flex-col gap-5">
        <h3 className="text-base font-bold text-[#1D242B]">
          {t('addListing.legal.securityNoise')}
        </h3>
        <div className="flex items-center justify-between p-[34px] border-2 border-[#F0F2F5] rounded-2xl bg-white">
          <div className="flex flex-col gap-1.5 pe-8">
            <h4 className="text-lg font-bold text-[#1D242B]">
              {t('addListing.legal.securityCamera')}
            </h4>
            <p className="text-sm text-[#5E5E5E] leading-[1.625]">
              {t('addListing.legal.securityCameraHint')}
            </p>
          </div>
          <button
            type="button"
            title={t('addListing.legal.toggleSecurityCamera')}
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
            {t('addListing.legal.noiseMonitor')}
          </h4>
          <p className="text-sm text-[#5E5E5E] leading-[1.625]">
            {t('addListing.legal.noiseMonitorHint')}
          </p>
        </div>
        <button
          type="button"
          title={t('addListing.legal.toggleNoiseMonitor')}
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
            {t('addListing.legal.importantDisclosure')}
          </h4>
          <p className="text-[13px] text-[#5E5E5E] leading-[1.625]">
            {t('addListing.legal.disclosureText')}
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};
