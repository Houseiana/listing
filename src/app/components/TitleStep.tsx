import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { LookupsAPI } from '@/lib/api/backend-api';
import { PropertyFormData } from '../types';
import { useTranslation } from '@/lib/i18n/context';

interface TitleStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  validationErrors?: Record<string, string>;
  hasAttemptedNext?: boolean;
}

interface Highlight {
  id: number;
  name: string;
}

export const TitleStep = ({
  listing,
  setListing,
  validationErrors = {},
  hasAttemptedNext = false,
}: TitleStepProps) => {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return;
        const response = await LookupsAPI.getPropertyHighlights(token);
        if (response.success && response.data) {
          setHighlights(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch highlights:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHighlights();
  }, [getToken]);

  const toggleHighlight = (id: number) => {
    setListing({
      ...listing,
      highlights: listing.highlights.includes(id)
        ? listing.highlights.filter((h) => h !== id)
        : [...listing.highlights, id],
    });
  };

  const hasTitleError = hasAttemptedNext && validationErrors.title;
  const hasDescError = hasAttemptedNext && validationErrors.description;

  return (
    <div className="flex flex-col gap-6">
      {/* Title Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-[#2F3A45]">
          {t('addListing.title.shortTitlesWorkBest')}
        </h3>
        <div className="relative">
          <textarea
            value={listing.title}
            onChange={(e) =>
              setListing({ ...listing, title: e.target.value.replace(/\s{2,}/g, ' ').slice(0, 60) })
            }
            onBlur={() =>
              setListing({ ...listing, title: listing.title.trim() })
            }
            placeholder={t('addListing.title.titlePlaceholder')}
            maxLength={60}
            rows={4}
            className={`w-full px-5 py-5 border rounded-[12px] focus:ring-2 focus:ring-[#FCC519] focus:border-transparent outline-none text-base resize-none ${
              hasTitleError
                ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300'
                : 'border-[#E8E8E8] text-[#1D242B] placeholder-[#D2D2D2]'
            }`}
          />
          <span className="absolute bottom-4 left-5 text-xl font-medium text-[#2F3A45]">
            {listing.title.length}/60
          </span>
        </div>
      </div>

      {/* Description Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-[#2F3A45]">
          {t('addListing.title.descriptionHeading')}
        </h3>
        <div className="relative">
          <textarea
            value={listing.description}
            onChange={(e) =>
              setListing({
                ...listing,
                description: e.target.value.replace(/\s{2,}/g, ' ').slice(0, 500),
              })
            }
            onBlur={() =>
              setListing({ ...listing, description: listing.description.trim() })
            }
            placeholder={t('addListing.title.descriptionPlaceholder')}
            maxLength={500}
            rows={6}
            className={`w-full px-5 py-5 border rounded-[12px] focus:ring-2 focus:ring-[#FCC519] focus:border-transparent outline-none text-base resize-none ${
              hasDescError
                ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300'
                : 'border-[#E8E8E8] text-[#1D242B] placeholder-[#D2D2D2]'
            }`}
          />
          <span className="absolute bottom-4 left-5 text-xl font-medium text-[#2F3A45]">
            {listing.description.length}/500
          </span>
        </div>
      </div>

      {/* Highlights Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold text-[#2F3A45]">
          {t('addListing.title.highlightsHeading')}
        </h3>
        {loading ? (
          <div className="text-[#5E5E5E]">{t('addListing.title.loadingHighlights')}</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {highlights.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => toggleHighlight(h.id)}
                className={`px-[50px] py-5 rounded-2xl text-sm font-semibold transition-all ${
                  listing.highlights.includes(h.id)
                    ? 'bg-[#FCC519] text-[#1D242B] border border-transparent'
                    : 'bg-white text-[#1D242B] border border-[#E5E9EE] hover:border-[#FCC519]'
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
