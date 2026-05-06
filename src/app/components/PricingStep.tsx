import { useEffect } from 'react';
import { PropertyFormData } from '../types';
import { Star, Pencil } from 'lucide-react';
import { stripArabicNumerals, blockArabicNumeralKey } from '@/lib/utils/numeric-input';

interface PricingStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  readOnly?: boolean;
  currency?: string;
}

export const PricingStep = ({
  listing,
  setListing,
  readOnly,
  currency,
}: PricingStepProps) => {
  const starOptions = [1, 2, 3, 4, 5];
  const isEGP = currency === 'EGP';
  const minBasePrice = isEGP ? 1000 : 20;
  const maxBasePrice = isEGP ? 50000 : 10000;
  const maxCleaningFee = isEGP ? 3000 : 35;

  // Set default price to minimum when arriving at this step with no price set
  useEffect(() => {
    if (!readOnly && (!listing.basePrice || listing.basePrice === 0)) {
      setListing({ ...listing, basePrice: minBasePrice });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-10">
      {/* Star Rating Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold text-[#1D242B]">
          {'Star Rating'}
        </h3>
        <div className="flex flex-wrap gap-3">
          {starOptions.map((rating) => (
            <button
              key={rating}
              type="button"
              disabled={readOnly}
              onClick={() =>
                !readOnly && setListing({ ...listing, stars: rating })
              }
              className={`flex items-center gap-3.5 px-4 py-5 rounded-full border-2 transition-all ${
                readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
              } ${
                listing.stars === rating
                  ? 'border-[#FCC519] bg-white'
                  : 'border-[#F0F2F5] bg-[#FDFDFD] hover:border-[#FCC519]'
              }`}
            >
              <Star
                className={`w-5 h-5 ${
                  listing.stars === rating
                    ? 'text-[#FCC519] fill-[#FCC519]'
                    : 'text-[#F0F2F5] fill-[#F0F2F5]'
                }`}
              />
              <span className="text-sm font-semibold text-[#1D242B]">
                {rating === 1 ? `${rating} Star` : `${rating} Stars`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold text-[#1D242B]">{"Set Your Price"}</h3>

        {/* Main price card */}
        <div className="border border-[#F0F2F5] rounded-2xl p-[30px] flex flex-col items-center gap-5">
          <p className="text-base text-[#5E5E5E]">{"You can change this anytime"}</p>

          {/* Price display */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-baseline gap-[7px]">
              <span className="text-[40px] font-semibold text-[#2F3A45]">
                {currency || 'EGP'}
              </span>
              <input
                type="number"
                min={minBasePrice}
                max={maxBasePrice}
                value={listing.basePrice || ''}
                size={Math.max(String(listing.basePrice || '0').length, 1)}
                disabled={readOnly}
                onKeyDown={blockArabicNumeralKey}
                onChange={(e) => {
                  let val = parseInt(stripArabicNumerals(e.target.value));
                  if (isNaN(val)) val = 0;
                  if (val > maxBasePrice) val = maxBasePrice;
                  setListing({ ...listing, basePrice: val });
                }}
                className={`text-[58px] font-bold text-center border-0 focus:ring-0 outline-none bg-transparent p-0 ${
                  readOnly ? 'cursor-not-allowed text-gray-400' : ''
                } ${
                  listing.basePrice < minBasePrice || listing.basePrice > maxBasePrice
                    ? 'text-red-500'
                    : 'text-[#2F3A45]'
                }`}
              />
            </div>
            <div className="w-full h-[2px] bg-[#2F3A45]" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F3A45]">
                {'NIGHTLY RATE'}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F3A45]">
                {currency || 'USD'}
              </span>
            </div>
          </div>

          {listing.basePrice < minBasePrice && (
            <p className="text-red-500 text-sm font-medium">
              {`Minimum price is ${currency || 'EGP'} ${minBasePrice.toLocaleString()}`}
            </p>
          )}
          {listing.basePrice > maxBasePrice && (
            <p className="text-red-500 text-sm font-medium">
              {`Maximum price is ${currency || 'EGP'} ${maxBasePrice.toLocaleString()}`}
            </p>
          )}
        </div>

        {/* Fee cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Cleaning fee */}
          <div className="bg-[#FCFCFC] border border-[#F0F2F5] rounded-2xl p-6 flex flex-col gap-6">
            <div>
              <h4 className="text-[15px] font-semibold text-[#1D242B]">
                {'Cleaning Fee'}
              </h4>
              <p className="text-xs text-[#9CA3AF] mt-1">
                {'One-time fee charged to guests for cleaning'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 border-b-2 border-[#2F3A45] pb-0.5 group focus-within:border-[#FCC519] transition-colors">
                <span className="text-lg font-semibold text-[#2F3A45]">{currency || 'EGP'}</span>
                <input
                  type="number"
                  min="0"
                  max={maxCleaningFee}
                  title="Cleaning fee amount"
                  value={listing.cleaningFee || ''}
                  disabled={readOnly}
                  onKeyDown={blockArabicNumeralKey}
                  onChange={(e) => {
                    let val = parseInt(stripArabicNumerals(e.target.value));
                    if (isNaN(val)) val = 0;
                    const cap = Math.min(maxCleaningFee, listing.basePrice || maxCleaningFee);
                    if (val > cap) val = cap;
                    setListing({ ...listing, cleaningFee: val });
                  }}
                  className={`text-lg font-semibold w-16 border-0 focus:ring-0 outline-none bg-transparent p-0 ${
                    readOnly ? 'cursor-not-allowed text-gray-400' : ''
                  } ${
                    (listing.cleaningFee || 0) > maxCleaningFee
                      ? 'text-red-500'
                      : 'text-[#2F3A45]'
                  }`}
                />
                {!readOnly && <Pencil size={12} className="text-[#9CA3AF] group-focus-within:text-[#FCC519] transition-colors flex-shrink-0" />}
              </div>
              <span className="text-[10px] font-bold text-[#10B981] bg-[rgba(16,185,129,0.1)] px-3 py-1.5 rounded-full">
                {'Optional'}
              </span>
            </div>
            {(listing.cleaningFee || 0) > maxCleaningFee && (
              <p className="text-xs text-red-500 font-medium">{`Cleaning fee cannot exceed ${currency || 'EGP'} ${maxCleaningFee.toLocaleString()}`}</p>
            )}
            {isEGP && (listing.cleaningFee || 0) > (listing.basePrice || 0) && (listing.basePrice || 0) > 0 && (
              <p className="text-xs text-red-500 font-medium">{'Cleaning fee cannot exceed the nightly rate'}</p>
            )}
          </div>

          {/* Electrical fee */}
          <div className="bg-[#FCFCFC] border border-[#F0F2F5] rounded-2xl p-6 flex flex-col gap-6">
            <div>
              <h4 className="text-[15px] font-semibold text-[#1D242B]">
                {'Electrical Fee'}
              </h4>
              <p className="text-xs text-[#9CA3AF] mt-1">
                {'One-time fee charged to guests for electricity'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 border-b-2 border-[#2F3A45] pb-0.5 group focus-within:border-[#FCC519] transition-colors">
                <span className="text-lg font-semibold text-[#2F3A45]">{currency || 'EGP'}</span>
                <input
                  type="number"
                  min="0"
                  max={maxCleaningFee}
                  title="Electrical fee amount"
                  value={listing.electricalFee || ''}
                  disabled={readOnly}
                  onKeyDown={blockArabicNumeralKey}
                  onChange={(e) => {
                    let val = parseInt(stripArabicNumerals(e.target.value));
                    if (isNaN(val)) val = 0;
                    if (val > maxCleaningFee) val = maxCleaningFee;
                    setListing({ ...listing, electricalFee: val });
                  }}
                  className={`text-lg font-semibold w-16 border-0 focus:ring-0 outline-none bg-transparent p-0 ${
                    readOnly ? 'cursor-not-allowed text-gray-400' : ''
                  } text-[#2F3A45]`}
                />
                {!readOnly && <Pencil size={12} className="text-[#9CA3AF] group-focus-within:text-[#FCC519] transition-colors flex-shrink-0" />}
              </div>
              <span className="text-[10px] font-bold text-[#10B981] bg-[rgba(16,185,129,0.1)] px-3 py-1.5 rounded-full">
                {'Optional'}
              </span>
            </div>
          </div>

          {/* Water fee */}
          <div className="bg-[#FCFCFC] border border-[#F0F2F5] rounded-2xl p-6 flex flex-col gap-6">
            <div>
              <h4 className="text-[15px] font-semibold text-[#1D242B]">
                {'Water Fee'}
              </h4>
              <p className="text-xs text-[#9CA3AF] mt-1">
                {'One-time fee charged to guests for water'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 border-b-2 border-[#2F3A45] pb-0.5 group focus-within:border-[#FCC519] transition-colors">
                <span className="text-lg font-semibold text-[#2F3A45]">{currency || 'EGP'}</span>
                <input
                  type="number"
                  min="0"
                  max={maxCleaningFee}
                  title="Water fee amount"
                  value={listing.waterFee || ''}
                  disabled={readOnly}
                  onKeyDown={blockArabicNumeralKey}
                  onChange={(e) => {
                    let val = parseInt(stripArabicNumerals(e.target.value));
                    if (isNaN(val)) val = 0;
                    if (val > maxCleaningFee) val = maxCleaningFee;
                    setListing({ ...listing, waterFee: val });
                  }}
                  className={`text-lg font-semibold w-16 border-0 focus:ring-0 outline-none bg-transparent p-0 ${
                    readOnly ? 'cursor-not-allowed text-gray-400' : ''
                  } text-[#2F3A45]`}
                />
                {!readOnly && <Pencil size={12} className="text-[#9CA3AF] group-focus-within:text-[#FCC519] transition-colors flex-shrink-0" />}
              </div>
              <span className="text-[10px] font-bold text-[#10B981] bg-[rgba(16,185,129,0.1)] px-3 py-1.5 rounded-full">
                {'Optional'}
              </span>
            </div>
          </div>

          {/* Weekend Surge */}
          <div className="bg-[#FCFCFC] border border-[#F0F2F5] rounded-2xl p-6 flex flex-col gap-6 opacity-60 cursor-not-allowed select-none">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[15px] font-semibold text-[#1D242B]">
                    {'Weekend Surge'}
                  </h4>
                  <span className="text-[10px] font-bold text-white bg-[#1D242B] px-2.5 py-1 rounded-full">
                    {'Coming Soon'}
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  {'Charge more on weekends automatically'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 border-b-2 border-[#2F3A45] pb-0.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  title="Weekend surge percentage"
                  value={0}
                  disabled
                  className="text-lg font-semibold w-12 border-0 focus:ring-0 outline-none bg-transparent p-0 text-[#2F3A45] cursor-not-allowed"
                />
                <span className="text-lg font-semibold text-[#2F3A45]">%</span>
              </div>
              <span className="text-[10px] font-bold text-[#10B981] bg-[rgba(16,185,129,0.1)] px-3 py-1.5 rounded-full">
                {'Optional'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
