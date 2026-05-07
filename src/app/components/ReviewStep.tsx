import { PropertyFormData } from '../types';
import {
  Camera,
  Check,
  Calendar,
  Settings,
  Star,
  Bed,
  Bath,
  Users,
  Expand,
  MapPin,
  DollarSign,
  Clock,
  Shield,
  Zap,
  Tag,
  DoorOpen,
} from 'lucide-react';
import { useFileUrls } from '@/hooks/use-file-urls';
import { useTranslation } from '@/lib/i18n/context';

interface ReviewStepProps {
  listing: PropertyFormData;
  currency?: string;
}

export const ReviewStep = ({ listing, currency }: ReviewStepProps) => {
  const { t } = useTranslation();
  const [firstPhotoUrl] = useFileUrls(
    listing.photos.length > 0 ? [listing.photos[0]] : []
  );
  return (
  <div className="flex flex-col gap-[30px]">
    {/* Header */}
    <p className="text-xl font-medium text-black">
      {t('addListing.review.heading')}
    </p>

    <div className="flex flex-col lg:flex-row gap-8">
      {/* Preview Card */}
      <div className="w-full lg:w-[392px] flex-shrink-0 flex flex-col gap-[17px]">
        {/* Image */}
        <div className="w-full h-[280px] rounded-[21px] overflow-hidden bg-gray-100">
          {listing.photos.length > 0 ? (
            <img
              src={firstPhotoUrl ?? ''}
              alt="Cover Photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Basic Details */}
        <div className="flex flex-col gap-[10px]">
          {/* Title */}
          {listing.title && (
            <h3 className="text-xl font-bold text-[#1D242B] truncate">
              {listing.title}
            </h3>
          )}

          {/* Location + Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[#5E5E5E]">
              <MapPin className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm font-medium">
                {listing.cityName || t('addListing.review.city')}
                {listing.countryName || listing.country
                  ? `, ${listing.countryName || listing.country}`
                  : ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-[#1D242B]">
                {listing.stars || '5.0'}
              </span>
            </div>
          </div>

          {/* Room stats */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#606060]" strokeWidth={1.5} />
              <span className="text-sm font-medium text-[#5E5E5E]">
                {`${listing.guests || 0} ${t('addListing.review.guests')}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <DoorOpen className="w-4 h-4 text-[#606060]" strokeWidth={1.5} />
              <span className="text-sm font-medium text-[#5E5E5E]">
                {`${listing.bedrooms || 0} ${t('addListing.review.bedrooms')}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-[#606060]" strokeWidth={1.5} />
              <span className="text-sm font-medium text-[#5E5E5E]">
                {`${listing.beds || 0} ${t('addListing.review.beds')}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-[#606060]" strokeWidth={1.5} />
              <span className="text-sm font-medium text-[#5E5E5E]">
                {`${listing.bathrooms || 0} ${t('addListing.review.bathrooms')}`}
              </span>
            </div>
            {listing.area_size > 0 && (
              <div className="flex items-center gap-1.5">
                <Expand className="w-4 h-4 text-[#606060]" strokeWidth={1.5} />
                <span className="text-sm font-medium text-[#5E5E5E]">
                  {listing.area_size} m²
                </span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#1D242B]" strokeWidth={1.5} />
            <span className="text-lg font-bold text-[#1D242B]">
              {currency || 'EGP'} {listing.basePrice || 0}
            </span>
            <span className="text-sm text-[#5E5E5E]">{t('addListing.review.perNight')}</span>
            {listing.cleaningFee > 0 && (
              <span className="text-xs text-[#9CA3AF] ml-1">
                {t('addListing.review.cleaningFeeNote', { currency: currency || 'EGP', amount: listing.cleaningFee })}
              </span>
            )}
            {listing.electricalFee > 0 && (
              <span className="text-xs text-[#9CA3AF] ml-1">
                {t('addListing.review.electricalFeeNote', { currency: currency || 'EGP', amount: listing.electricalFee })}
              </span>
            )}
            {listing.waterFee > 0 && (
              <span className="text-xs text-[#9CA3AF] ml-1">
                {t('addListing.review.waterFeeNote', { currency: currency || 'EGP', amount: listing.waterFee })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Extra Details */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Description */}
        {listing.description && (
          <div className="bg-[#F8F9FA] rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
              {t('addListing.review.descriptionLabel')}
            </span>
            <p className="text-sm text-[#2F3A45] leading-relaxed line-clamp-4">
              {listing.description}
            </p>
          </div>
        )}

        {/* Policies row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Check-in/out */}
          {(listing.checkInTime || listing.checkOutTime) && (
            <div className="bg-[#F8F9FA] rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                {t('addListing.review.checkInOutLabel')}
              </span>
              <div className="flex flex-col gap-1">
                {listing.checkInTime && (
                  <div className="flex items-center gap-1.5">
                    <Clock
                      className="w-3.5 h-3.5 text-[#606060]"
                      strokeWidth={1.5}
                    />
                    <span className="text-sm text-[#2F3A45]">
                      {t('addListing.review.checkInPrefix', { time: listing.checkInTime })}
                    </span>
                  </div>
                )}
                {listing.checkOutTime && (
                  <div className="flex items-center gap-1.5">
                    <Clock
                      className="w-3.5 h-3.5 text-[#606060]"
                      strokeWidth={1.5}
                    />
                    <span className="text-sm text-[#2F3A45]">
                      {t('addListing.review.checkOutPrefix', { time: listing.checkOutTime })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancellation Policy */}
          {listing.cancellationPolicy?.policyType && (
            <div className="bg-[#F8F9FA] rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                {t('addListing.review.cancellationLabel')}
              </span>
              <div className="flex items-center gap-1.5">
                <Shield
                  className="w-3.5 h-3.5 text-[#606060]"
                  strokeWidth={1.5}
                />
                <span className="text-sm text-[#2F3A45] capitalize">
                  {listing.cancellationPolicy.policyType === 'FLEXIBLE'
                    ? t('addListing.review.flexible')
                    : listing.cancellationPolicy.policyType === 'MODERATE'
                      ? t('addListing.review.moderate')
                      : t('addListing.review.fixed')}
                </span>
              </div>
              {listing.cancellationPolicy.policyType === 'FLEXIBLE' &&
                listing.cancellationPolicy.freeCancellationHours && (
                  <span className="text-xs text-[#9CA3AF]">
                    {t('addListing.review.freeCancelHours', { hours: listing.cancellationPolicy.freeCancellationHours })}
                  </span>
                )}
              {listing.cancellationPolicy.policyType === 'MODERATE' &&
                listing.cancellationPolicy.freeCancellationDays && (
                  <span className="text-xs text-[#9CA3AF]">
                    {t('addListing.review.freeCancelDays', { days: listing.cancellationPolicy.freeCancellationDays })}
                  </span>
                )}
            </div>
          )}

          {/* Booking settings */}
          <div className="bg-[#F8F9FA] rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
              {t('addListing.review.bookingLabel')}
            </span>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#606060]" strokeWidth={1.5} />
              <span className="text-sm text-[#2F3A45]">
                {listing.instantBook ? t('addListing.review.instantBookEnabled') : t('addListing.review.requestToBook')}
              </span>
            </div>
          </div>

          {/* Discounts */}
          {(listing.weeklyDiscount > 0 || listing.newListingDiscount > 0) && (
            <div className="bg-[#F8F9FA] rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                {t('addListing.review.discountsLabel')}
              </span>
              <div className="flex flex-col gap-1">
                {listing.newListingDiscount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Tag
                      className="w-3.5 h-3.5 text-[#606060]"
                      strokeWidth={1.5}
                    />
                    <span className="text-sm text-[#2F3A45]">
                      {t('addListing.review.newListingDiscount', { percent: listing.newListingDiscount })}
                    </span>
                  </div>
                )}
                {listing.weeklyDiscount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Tag
                      className="w-3.5 h-3.5 text-[#606060]"
                      strokeWidth={1.5}
                    />
                    <span className="text-sm text-[#2F3A45]">
                      {t('addListing.review.weeklyDiscount', { percent: listing.weeklyDiscount })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* House rules */}
        <div className="bg-[#F8F9FA] rounded-2xl p-4 flex flex-col gap-2">
          <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
            {t('addListing.review.houseRulesLabel')}
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: t('addListing.review.pets'), allowed: listing.allowPets },
              { label: t('addListing.review.smoking'), allowed: listing.allowSmoking },
              { label: t('addListing.review.events'), allowed: listing.allowParties },
            ].map(({ label, allowed }) => (
              <span
                key={label}
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  allowed
                    ? 'bg-[#D1FAE5] text-[#065F46]'
                    : 'bg-[#FEE2E2] text-[#991B1B]'
                }`}
              >
                {allowed ? '✓' : '✗'} {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Separator */}
    <div className="h-px bg-[#E5E9EE]" />

    {/* What's next */}
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold text-[#1D242B]">{t('addListing.review.whatsNext')}</h3>
      <div className="flex gap-5">
        {[
          {
            icon: Check,
            title: t('addListing.review.confirmPublishTitle'),
            desc: t('addListing.review.confirmPublishDesc'),
          },
          {
            icon: Calendar,
            title: t('addListing.review.setCalendarTitle'),
            desc: t('addListing.review.setCalendarDesc'),
          },
          {
            icon: Settings,
            title: t('addListing.review.adjustSettingsTitle'),
            desc: t('addListing.review.adjustSettingsDesc'),
          },
        ].map((item) => (
          <div key={item.title} className="flex-1 flex flex-col gap-4">
            <div className="w-10 h-10 bg-[#F8F9FA] border border-[#F0F2F5] rounded-full flex items-center justify-center flex-shrink-0">
              <item.icon
                className="w-5 h-5 text-[#1D242B]"
                strokeWidth={1.25}
              />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-base font-semibold text-[#1D242B]">
                {item.title}
              </h4>
              <p className="text-[13px] text-[#9CA3AF] leading-[1.625]">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};
