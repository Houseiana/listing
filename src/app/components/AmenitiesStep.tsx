import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { PropertyFormData } from '../types';
import {
  Wifi,
  Tv,
  Utensils,
  Car,
  Snowflake,
  Briefcase,
  Waves,
  Sun,
  Flame,
  Dumbbell,
  Palmtree,
  Mountain,
  Droplets,
  AlertCircle,
  Shield,
  Coffee,
  Microwave,
  Refrigerator,
  Bath,
  Bed,
  Trees,
  Wind,
  Lock,
  Camera,
  Speaker,
  Music,
  ArrowUpDown,
  Baby,
  Cigarette,
  CigaretteOff,
  Sparkles,
  ChefHat,
  Wine,
  Tent,
  Bike,
  Gamepad2,
  WashingMachine,
  PawPrint,
  Phone,
  Trash2,
  LucideIcon,
} from 'lucide-react';
import { LookupsAPI } from '@/lib/api/backend-api';
import { useTranslation } from '@/lib/i18n/context';

interface AmenitiesStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  readOnly?: boolean;
}

interface Amenity {
  id: string;
  name: string;
  icon?: string;
}

// Each entry: keywords (English + Arabic) → icon. First match wins, so put more
// specific entries (e.g. "no smoking") before more general ones ("smoking").
const ICON_KEYWORDS: Array<[string[], LucideIcon]> = [
  [['no smoking', 'ممنوع التدخين'], CigaretteOff],
  [['smoking', 'تدخين', 'مدخنين'], Cigarette],
  [['wifi', 'wi-fi', 'انترنت', 'إنترنت', 'واى فاى', 'واي فاي'], Wifi],
  [['tv', 'television', 'تليفزيون', 'تلفزيون', 'تلفاز'], Tv],
  [['coffee', 'espresso', 'قهوة'], Coffee],
  [['microwave', 'ميكروويف'], Microwave],
  [['fridge', 'refrigerator', 'ثلاجة', 'تلاجة'], Refrigerator],
  [['kitchen', 'cook', 'مطبخ'], Utensils],
  [['chef', 'cooking class'], ChefHat],
  [['wine', 'bar', 'نبيذ', 'بار'], Wine],
  [['washer', 'washing machine', 'laundry', 'غسالة', 'مغسلة', 'غسيل'], WashingMachine],
  [['parking', 'garage', 'موقف', 'كراج', 'جراج', 'سيارات', 'انتظار'], Car],
  [['air conditioning', 'aircon', 'a/c', 'ac ', 'تكييف', 'مكيف'], Snowflake],
  [['heat', 'heater', 'heating', 'تدفئة'], Wind],
  [['fan', 'ventilation', 'مروحة'], Wind],
  [['workspace', 'desk', 'office', 'مكتب', 'مساحة عمل'], Briefcase],
  [['hot tub', 'jacuzzi', 'جاكوزى', 'جاكوزي'], Waves],
  [['pool', 'swimming', 'مسبح', 'حمام سباحة', 'بسين', 'بركة'], Waves],
  [['lake', 'river', 'بحيرة', 'نهر'], Waves],
  [['beach', 'sea', 'شاطئ', 'بحر', 'كورنيش'], Palmtree],
  [['ski', 'mountain', 'تزلج', 'جبل'], Mountain],
  [['balcony', 'patio', 'terrace', 'شرفة', 'بلكونة', 'تراس'], Sun],
  [['fireplace', 'fire pit', 'bonfire', 'موقد', 'مدفأة'], Flame],
  [['bbq', 'grill', 'barbecue', 'شواية', 'شواء', 'مشوى'], Flame],
  [['gym', 'exercise', 'fitness', 'workout', 'صالة رياضية', 'جيم', 'تمرين'], Dumbbell],
  [['shower', 'دش'], Droplets],
  [['bathtub', 'bath', 'حمام'], Bath],
  [['bed', 'سرير'], Bed],
  [['crib', 'baby', 'kid', 'طفل', 'مهد', 'أطفال'], Baby],
  [['garden', 'yard', 'plant', 'حديقة', 'نباتات'], Trees],
  [['camera', 'cctv', 'surveillance', 'كاميرا', 'مراقبة'], Camera],
  [['lock', 'safe', 'security', 'قفل', 'خزنة', 'أمان'], Lock],
  [['phone', 'هاتف', 'تليفون'], Phone],
  [['speaker', 'sound system', 'سماعات', 'صوت'], Speaker],
  [['music', 'piano', 'instrument', 'موسيقى', 'بيانو'], Music],
  [['elevator', 'lift', 'مصعد', 'اسانسير', 'أسانسير'], ArrowUpDown],
  [['cleaning', 'cleaner', 'تنظيف', 'نظافة'], Sparkles],
  [['trash', 'garbage', 'waste', 'قمامة', 'زبالة', 'نفايات'], Trash2],
  [['camping', 'tent', 'تخييم', 'خيمة'], Tent],
  [['bike', 'bicycle', 'cycling', 'دراجة', 'عجلة'], Bike],
  [['pets', 'pet ', 'dog', 'cat', 'حيوان', 'حيوانات', 'أليفة', 'كلب', 'قطة'], PawPrint],
  [['game', 'pool table', 'play', 'ألعاب', 'لعبة', 'بلياردو'], Gamepad2],
  [['smoke alarm', 'smoke detector', 'كاشف دخان', 'انذار دخان', 'إنذار دخان'], AlertCircle],
  [['carbon monoxide', 'co alarm', 'كاشف غاز', 'كربون'], AlertCircle],
  [['first aid', 'extinguisher', 'safety', 'إسعاف', 'إسعافات', 'سلامة', 'طفاية'], Shield],
];

const getAmenityIcon = (amenity: Amenity): LucideIcon => {
  const candidates = [amenity.icon, amenity.name]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.toLowerCase().trim());

  for (const candidate of candidates) {
    for (const [keywords, icon] of ICON_KEYWORDS) {
      if (keywords.some((keyword) => candidate.includes(keyword.toLowerCase()))) {
        return icon;
      }
    }
  }
  return Sparkles;
};

export const AmenitiesStep = ({
  listing,
  setListing,
  readOnly,
}: AmenitiesStepProps) => {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return;
        const res = await LookupsAPI.getAmenities(token);
        if (res.success && res.data) setAmenities(res.data);
      } catch (error) {
        console.error('Failed to fetch amenities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getToken]);

  const toggleAmenity = (id: number) => {
    setListing({
      ...listing,
      amenities: listing.amenities.includes(id)
        ? listing.amenities.filter((a) => a !== id)
        : [...listing.amenities, id],
    });
  };

  const renderAmenityButton = (amenity: Amenity) => {
    const IconComponent = getAmenityIcon(amenity);
    const id = Number(amenity.id);
    const isSelected = listing.amenities.includes(id);

    return (
      <button
        type="button"
        key={amenity.id}
        onClick={() => !readOnly && toggleAmenity(id)}
        disabled={readOnly}
        className={`w-full h-[76px] px-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 ${
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
        {t('addListing.amenities.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-base font-semibold text-[#2F3A45] mb-4">
          {t('addListing.amenities.heading')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {amenities.map((a) => renderAmenityButton(a))}
        </div>
      </div>
    </div>
  );
};
