import { PropertyFormData } from '../types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CalendarDays,
  Check,
} from 'lucide-react';

interface CancellationPolicyStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
}

export function CancellationPolicyStep({
  listing,
  setListing,
}: CancellationPolicyStepProps) {
  const policies = [
    {
      id: 'FLEXIBLE',
      label: 'Flexible',
      description: 'Full refund if cancelled within the free cancellation window',
      icon: Shield,
    },
    {
      id: 'MODERATE',
      label: 'Moderate',
      description: 'Full refund if cancelled a set number of days before check-in',
      icon: ShieldCheck,
    },
    {
      id: 'FIXED',
      label: 'Fixed',
      description: 'No refund after booking is confirmed',
      icon: ShieldAlert,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base font-bold text-[#1D242B]">
        {'Choose a cancellation policy for your listing'}
      </p>

      {/* Policy cards */}
      <div className="flex flex-col gap-4">
        {policies.map((policy) => {
          const isSelected =
            listing.cancellationPolicy?.policyType === policy.id;
          const Icon = policy.icon;

          return (
            <div
              key={policy.id}
              onClick={() => {
                const newPolicy: any = {
                  policyType: policy.id,
                };
                if (policy.id === 'FLEXIBLE') {
                  const existingHours = listing.cancellationPolicy?.freeCancellationHours;
                  newPolicy.freeCancellationHours = (existingHours === 24 || existingHours === 48) ? existingHours : 24;
                } else if (policy.id === 'MODERATE') {
                  const existing = listing.cancellationPolicy?.freeCancellationDays;
                  newPolicy.freeCancellationDays = (existing && existing >= 5 && existing <= 30) ? existing : 5;
                }
                setListing({
                  ...listing,
                  cancellationPolicy: newPolicy,
                });
              }}
              className={`flex items-center justify-between px-6 py-5 rounded-3xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[rgba(252,197,25,0.02)] border-[#FCC519]'
                  : 'bg-white border-[#F0F2F5]'
              }`}
            >
              <div className="flex items-center gap-5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-[#FCC519]' : 'bg-[#F8F9FA]'
                  }`}
                >
                  <Icon
                    className="w-6 h-6 text-[#2F3A45]"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-[17px] font-bold text-[#1D242B]">
                    {policy.label}
                  </h4>
                  <p className="text-[13px] text-[#5E5E5E]">
                    {policy.description}
                  </p>
                </div>
              </div>
              <div
                className={`w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[#FCC519] border-[#FCC519]'
                    : 'bg-white border-[#F0F2F5]'
                }`}
              >
                {isSelected && (
                  <Check
                    className="w-[17px] h-[17px] text-[#1D242B]"
                    strokeWidth={2.2}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Flexible sub-options */}
      {listing.cancellationPolicy?.policyType === 'FLEXIBLE' && (
        <div className="bg-[#F8F9FA] border border-[#F0F2F5] rounded-[32px] p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <AlertCircle
              className="w-5 h-5 text-[#FCC519]"
              strokeWidth={1.67}
            />
            <h3 className="text-base font-bold text-[#1D242B]">
              {'Select timeframe'}
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { hours: 24, label: '24 Hours' },
              { hours: 48, label: '48 Hours' },
            ].map((option) => {
              const isOptionSelected =
                listing.cancellationPolicy?.freeCancellationHours ===
                option.hours;
              return (
                <button
                  key={option.hours}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setListing({
                      ...listing,
                      cancellationPolicy: {
                        ...listing.cancellationPolicy!,
                        freeCancellationHours: option.hours,
                      },
                    });
                  }}
                  className={`flex-1 h-20 flex items-center justify-between px-6 rounded-[20px] border-2 bg-white transition-all ${
                    isOptionSelected
                      ? 'border-[#FCC519] shadow-[0_0_0_4px_rgba(252,197,25,0.1)]'
                      : 'border-[#F0F2F5]'
                  }`}
                >
                  <span className="text-sm font-semibold text-[#1D242B]">
                    {option.label}
                  </span>
                  <div
                    className={`w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isOptionSelected
                        ? 'bg-[#FCC519] border-[#FCC519]'
                        : 'bg-white border-[#F0F2F5]'
                    }`}
                  >
                    {isOptionSelected && (
                      <Check
                        className="w-[17px] h-[17px] text-[#1D242B]"
                        strokeWidth={2.2}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Moderate sub-options */}
      {listing.cancellationPolicy?.policyType === 'MODERATE' && (
        <div className="bg-[#F8F9FA] border border-[#F0F2F5] rounded-[32px] p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <CalendarDays
              className="w-5 h-5 text-[#FCC519]"
              strokeWidth={1.67}
            />
            <h3 className="text-base font-bold text-[#1D242B]">
              {'Customize moderate policy'}
            </h3>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#2F3A45] mb-3">
              {'How many days before check-in can guests cancel for free?'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="30"
                title="Free cancellation days"
                value={listing.cancellationPolicy.freeCancellationDays || ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setListing({ ...listing, cancellationPolicy: { ...listing.cancellationPolicy!, freeCancellationDays: '' as any } });
                    return;
                  }
                  const num = parseInt(raw, 10);
                  if (isNaN(num) || num < 0) return;
                  const clamped = Math.min(num, 30);
                  setListing({ ...listing, cancellationPolicy: { ...listing.cancellationPolicy!, freeCancellationDays: clamped } });
                }}
                onBlur={(e) => {
                  const num = parseInt(e.target.value, 10);
                  const clamped = isNaN(num) || num < 5 ? 5 : Math.min(num, 30);
                  setListing({ ...listing, cancellationPolicy: { ...listing.cancellationPolicy!, freeCancellationDays: clamped } });
                }}
                className="block w-full pl-6 pr-16 h-[60px] border-2 border-[#F0F2F5] rounded-2xl text-base font-medium text-[#2F3A45] focus:ring-2 focus:ring-[#FCC519] focus:border-transparent outline-none bg-white"
                placeholder="e.g. 5"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-medium text-[#5E5E5E]">
                {'days'}
              </span>
            </div>
            <p className="mt-3 text-xs text-[#5E5E5E]">
              {'Choose between 5 and 30 days before check-in'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
