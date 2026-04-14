import { useState, useEffect } from 'react';
import { PropertyFormData } from '../types';
import {
  Wifi,
  Tv,
  Utensils,
  Shirt,
  Car,
  Snowflake,
  Briefcase,
  Waves,
  Sun,
  Flame,
  Star,
  Dumbbell,
  Palmtree,
  Mountain,
  Droplets,
  AlertCircle,
  Shield,
  LucideIcon,
} from 'lucide-react';
import { LookupsAPI } from '@/lib/api/backend-api';

interface AmenitiesStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  readOnly?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Wifi: Wifi,
  TV: Tv,
  Kitchen: Utensils,
  Washer: Shirt,
  Parking: Car,
  'Free parking on premises': Car,
  'Air conditioning': Snowflake,
  AC: Snowflake,
  'Dedicated workspace': Briefcase,
  Pool: Waves,
  'Hot tub': Waves,
  'Patio or balcony': Sun,
  'BBQ grill': Flame,
  'Fire pit': Flame,
  'Pool table': Star,
  'Indoor fireplace': Flame,
  Piano: Star,
  'Exercise equipment': Dumbbell,
  'Lake access': Waves,
  'Beach access': Palmtree,
  'Ski-in/Ski-out': Mountain,
  'Outdoor shower': Droplets,
  'Smoke alarm': AlertCircle,
  'First aid kit': Shield,
  'Fire extinguisher': Shield,
  'Carbon monoxide alarm': AlertCircle,
  wifi: Wifi,
  tv: Tv,
  kitchen: Utensils,
  washer: Shirt,
  parking: Car,
  pool: Waves,
  gym: Dumbbell,
};

interface Amenity {
  id: string;
  name: string;
  icon?: string;
}

export const AmenitiesStep = ({
  listing,
  setListing,
  readOnly,
}: AmenitiesStepProps) => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await LookupsAPI.getAmenities();
        if (res.success && res.data) setAmenities(res.data);
      } catch (error) {
        console.error('Failed to fetch amenities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleAmenity = (id: number) => {
    setListing({
      ...listing,
      amenities: listing.amenities.includes(id)
        ? listing.amenities.filter((a) => a !== id)
        : [...listing.amenities, id],
    });
  };

  const renderAmenityButton = (amenity: Amenity) => {
    const IconComponent =
      ICON_MAP[amenity.name] || ICON_MAP[amenity.icon || ''] || Star;
    const id = Number(amenity.id);
    const isSelected = listing.amenities.includes(id);

    return (
      <button
        type="button"
        key={amenity.id}
        onClick={() => !readOnly && toggleAmenity(id)}
        disabled={readOnly}
        className={`w-full sm:w-[260px] h-[76px] px-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 ${
          readOnly ? 'cursor-not-allowed opacity-70' : ''
        } ${
          isSelected
            ? 'border-[#FCC519] bg-[rgba(252,197,25,0.02)]'
            : 'border-[#F0F2F5] bg-white hover:border-[#FCC519]'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-[#FCC519]' : 'bg-[#F8F9FA]'
        }`}>
          <IconComponent
            className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#5E5E5E]'}`}
            strokeWidth={1.5}
          />
        </div>
        <span className="text-sm font-medium text-[#1D242B] text-left">
          {amenity.name}
        </span>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        {'Loading amenities...'}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-base font-semibold text-[#2F3A45] mb-4">
          {'Amenities'}
        </h3>
        <div className="flex flex-wrap gap-3">
          {amenities.map((a) => renderAmenityButton(a))}
        </div>
      </div>
    </div>
  );
};
