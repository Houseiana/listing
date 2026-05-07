import { PropertyFormData } from '../types';
import { PawPrint, Cigarette, PartyPopper, UserX, Heart } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface HouseRulesStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  readOnly?: boolean;
}

export const HouseRulesStep = ({
  listing,
  setListing,
  readOnly,
}: HouseRulesStepProps) => {
  const { t } = useTranslation();
  const ruleLabels: Record<string, string> = {
    petsAllowed: t('addListing.houseRules.petsAllowed'),
    smokingAllowed: t('addListing.houseRules.smokingAllowed'),
    eventsAllowed: t('addListing.houseRules.eventsAllowed'),
    guestVisitorsAllowed: t('addListing.houseRules.guestVisitorsAllowed'),
    marriedCouplesOnly: t('addListing.houseRules.marriedCouplesOnly'),
  };

  return (
  <div className="flex flex-col gap-[50px]">
    {/* Toggle rules */}
    <div className="flex flex-col gap-3">
      {[
        { key: 'allowPets', icon: PawPrint, labelKey: 'petsAllowed' },
        {
          key: 'allowSmoking',
          icon: Cigarette,
          labelKey: 'smokingAllowed',
        },
        {
          key: 'allowParties',
          icon: PartyPopper,
          labelKey: 'eventsAllowed',
        },
        {
          key: 'allowGuests',
          icon: UserX,
          labelKey: 'guestVisitorsAllowed',
        },
        { key: 'allowMarriedOnly', icon: Heart, labelKey: 'marriedCouplesOnly' },
      ].map((rule) => (
        <div
          key={rule.key}
          className="flex items-center justify-between px-5 py-5 border border-[#E5E9EE] rounded-[20px] bg-white"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[12px] bg-[#F8F9FA] flex items-center justify-center flex-shrink-0">
              <rule.icon className="w-5 h-5 text-[#5E5E5E]" strokeWidth={1.5} />
            </div>
            <span className="text-base text-[#1D242B]">{ruleLabels[rule.labelKey]}</span>
          </div>
          <button
            type="button"
            title={`${t('addListing.houseRules.toggle')} ${ruleLabels[rule.labelKey]}`}
            onClick={() =>
              !readOnly &&
              setListing({
                ...listing,
                [rule.key]: !listing[rule.key as keyof PropertyFormData],
              })
            }
            disabled={readOnly}
            className={`relative min-w-[44px] max-w-[44px] min-h-[26px] max-h-[26px] rounded-full transition-colors flex-shrink-0 ${
              listing[rule.key as keyof PropertyFormData]
                ? 'bg-[#FCC519]'
                : 'bg-[#E5E9EE]'
            } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-[22px] h-[22px] bg-white rounded-full shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] transition-transform ${
                listing[rule.key as keyof PropertyFormData]
                  ? 'translate-x-[18px]'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}
    </div>

    {/* Check-in and checkout times */}
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-bold text-[#2F3A45]">
        {t('addListing.houseRules.checkInOutTimes')}
      </h3>
      <div className="flex items-center gap-6">
        <div className="flex-1 flex flex-col gap-3.5">
          <label className="text-sm font-semibold text-[#2F3A45]">
            {t('addListing.houseRules.checkInAfter')}
          </label>
          <select
            title={t('addListing.houseRules.checkInAfter')}
            value={listing.checkInTime}
            disabled={readOnly}
            onChange={(e) =>
              setListing({ ...listing, checkInTime: e.target.value })
            }
            className={`w-full px-6 h-[60px] border border-[#F0F2F5] rounded-2xl text-base font-medium text-[#2F3A45] focus:ring-2 focus:ring-[#FCC519] focus:border-transparent outline-none appearance-none bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center] ${
              readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
            }`}
          >
            {[
              '12:00 PM',
              '1:00 PM',
              '2:00 PM',
              '3:00 PM',
              '4:00 PM',
              '5:00 PM',
            ].map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
            <option value="Flexible">{t('addListing.houseRules.flexible')}</option>
          </select>
        </div>
        <div className="flex-1 flex flex-col gap-3.5">
          <label className="text-sm font-semibold text-[#2F3A45]">
            {t('addListing.houseRules.checkoutBefore')}
          </label>
          <select
            title={t('addListing.houseRules.checkoutBefore')}
            value={listing.checkOutTime}
            disabled={readOnly}
            onChange={(e) =>
              setListing({ ...listing, checkOutTime: e.target.value })
            }
            className={`w-full px-6 h-[60px] border border-[#F0F2F5] rounded-2xl text-base font-medium text-[#2F3A45] focus:ring-2 focus:ring-[#FCC519] focus:border-transparent outline-none appearance-none bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center] ${
              readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
            }`}
          >
            {['10:00 AM', '11:00 AM', '12:00 PM'].map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
            <option value="Flexible">{t('addListing.houseRules.flexible')}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
  );
};
