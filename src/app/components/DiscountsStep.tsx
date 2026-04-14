import { PropertyFormData } from '../types';
import { Sun, CalendarDays, Check } from 'lucide-react';

interface DiscountsStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  readOnly?: boolean;
}

export const DiscountsStep = ({
  listing,
  setListing,
  readOnly,
}: DiscountsStepProps) => {
  const hasAnyDiscount =
    listing.newListingDiscount > 0 || listing.weeklyDiscount > 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base font-bold text-[#1D242B]">
        {'Add discounts to attract more guests'}
      </p>

      {/* New Listing Promotion */}
      <div
        className={`flex items-center justify-between px-4 py-4 sm:px-5 sm:py-5 lg:px-8 lg:h-[124px] rounded-2xl sm:rounded-[32px] border-2 transition-all ${
          readOnly ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
        } ${
          listing.newListingDiscount > 0
            ? 'bg-[rgba(252,197,25,0.02)] border-[#FCC519] shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]'
            : 'bg-white border-[#F0F2F5]'
        }`}
        onClick={() =>
          !readOnly &&
          setListing({
            ...listing,
            newListingDiscount: listing.newListingDiscount > 0 ? 0 : 20,
          })
        }
      >
        <div className="flex items-center gap-3 lg:gap-6 min-w-0 flex-1">
          <div
            className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 ${
              listing.newListingDiscount > 0 ? 'bg-[#FCC519]' : 'bg-[#F8F9FA]'
            }`}
          >
            <Sun className="w-5 h-5 lg:w-6 lg:h-6 text-[#2F3A45]" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <h4 className="text-sm lg:text-lg font-bold text-[#1D242B] leading-tight">
              {'New Listing Promotion'}
            </h4>
            <p className="text-sm text-[#5E5E5E] leading-snug">
              {'Offer 20% off your first 3 bookings to get started'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-6 flex-shrink-0 ml-2">
          <div className="bg-[#F0F2F5] rounded-xl px-2.5 lg:px-4 py-1.5">
            <span className="text-sm lg:text-lg font-bold text-[#1D242B]">20%</span>
          </div>
          <div
            className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              listing.newListingDiscount > 0
                ? 'bg-[#FCC519] border-[#FCC519]'
                : 'bg-white border-[#F0F2F5]'
            }`}
          >
            {listing.newListingDiscount > 0 && (
              <Check
                className="w-3.5 h-3.5 lg:w-[17px] lg:h-[17px] text-[#1D242B]"
                strokeWidth={2.2}
              />
            )}
          </div>
        </div>
      </div>

      {/* Weekly Discount */}
      <div
        className={`flex items-center justify-between px-4 py-4 sm:px-5 sm:py-5 lg:px-8 lg:h-[124px] rounded-2xl sm:rounded-[32px] border-2 transition-all ${
          readOnly ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
        } ${
          listing.weeklyDiscount > 0
            ? 'bg-[rgba(252,197,25,0.02)] border-[#FCC519] shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]'
            : 'bg-white border-[#F0F2F5]'
        }`}
        onClick={() =>
          !readOnly &&
          setListing({
            ...listing,
            weeklyDiscount: listing.weeklyDiscount > 0 ? 0 : 20,
          })
        }
      >
        <div className="flex items-center gap-3 lg:gap-6 min-w-0 flex-1">
          <div
            className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 ${
              listing.weeklyDiscount > 0 ? 'bg-[#FCC519]' : 'bg-[#F8F9FA]'
            }`}
          >
            <CalendarDays
              className="w-5 h-5 lg:w-6 lg:h-6 text-[#2F3A45]"
              strokeWidth={1.5}
            />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <h4 className="text-sm lg:text-lg font-bold text-[#1D242B] leading-tight">
              {'Weekly Discount'}
            </h4>
            <p className="text-xs text-[#5E5E5E] leading-snug">
              {'Offer 20% off for stays of 7 nights or more'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-6 flex-shrink-0 ml-2">
          <div className="bg-[#F0F2F5] rounded-xl px-2.5 lg:px-4 py-1.5">
            <span className="text-sm lg:text-lg font-bold text-[#1D242B]">20%</span>
          </div>
          <div
            className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              listing.weeklyDiscount > 0
                ? 'bg-[#FCC519] border-[#FCC519]'
                : 'bg-white border-[#F0F2F5]'
            }`}
          >
            {listing.weeklyDiscount > 0 && (
              <Check
                className="w-3.5 h-3.5 lg:w-[17px] lg:h-[17px] text-[#1D242B]"
                strokeWidth={2.2}
              />
            )}
          </div>
        </div>
      </div>

      {/* Success banner when discounts are selected */}
      {hasAnyDiscount && (
        <div className="flex items-center gap-4 px-6 py-4 border-2 border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.05)] rounded-3xl">
          <div className="w-10 h-10 rounded-full bg-[rgba(16,185,129,0.2)] flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-[#10B981]" strokeWidth={2.5} />
          </div>
          <p className="text-sm font-semibold text-[#10B981]">
            {'Great choice! Discounts help you get more bookings.'}
          </p>
        </div>
      )}
    </div>
  );
};
