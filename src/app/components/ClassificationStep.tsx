import { PropertyFormData } from '../types';
import { Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface ClassificationStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  readOnly?: boolean;
}

export function ClassificationStep({
  listing,
  setListing,
  readOnly,
}: ClassificationStepProps) {
  const { t } = useTranslation();
  const options = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold mb-2">{t('addListing.classification.heading')}</h2>
        <p className="text-gray-500">{t('addListing.classification.subheading')}</p>
      </div>

      <div className="space-y-4">
        {options.map((rating) => (
          <label
            key={rating}
            className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
              readOnly ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
            } ${
              listing.stars === rating
                ? 'border-teal-600 text-primary-50 ring-1 ring-teal-600'
                : readOnly
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="stars"
                value={rating}
                disabled={readOnly}
                checked={listing.stars === rating}
                onChange={() =>
                  !readOnly && setListing({ ...listing, stars: rating })
                }
                className={`w-5 h-5 text-primary border-gray-300 focus:ring-teal-500 ${
                  readOnly ? 'cursor-not-allowed opacity-70' : ''
                }`}
              />
              <div className="font-medium text-gray-900">
                <span className="flex gap-0.5 mb-2">
                  {[...Array(rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-amber-400 fill-amber-400"
                    />
                  ))}
                </span>
                {rating} {rating === 1 ? t('addListing.classification.star') : t('addListing.classification.stars')}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
