import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { LookupsAPI } from '@/lib/api/backend-api';
import {
  Home,
  Building2,
  Castle,
  TreePine,
  Warehouse,
  Hotel,
  Ship,
  Tractor,
  DoorOpen,
  Building,
  BedDouble,
  Mountain,
  LucideIcon,
} from 'lucide-react';

interface PropertyType {
  id: string;
  name: string;
  label: string;
  icon: LucideIcon;
}

const ICON_MAP: Record<string, LucideIcon> = {
  // Exact matches from API
  'apartment / condo': Building2,
  'house': Home,
  'villa': Castle,
  'studio / loft': Warehouse,
  'townhouse': Building,
  'guesthouse / annex': DoorOpen,
  'serviced apartment': Hotel,
  'aparthotel': Building2,
  'cabin / chalet': Mountain,
  'farm stay': Tractor,
  'houseboat': Ship,
  'casa': Home,
  'other': BedDouble,
  // Fallback single-word matches
  'apartment': Building2,
  'condo': Building2,
  'cabin': TreePine,
  'chalet': Mountain,
  'loft': Warehouse,
  'studio': Warehouse,
  'cottage': TreePine,
  'guesthouse': DoorOpen,
  'annex': DoorOpen,
  'farm': Tractor,
};

function findIcon(name: string): LucideIcon {
  const lower = name.toLowerCase().trim();
  // Try exact match first
  if (ICON_MAP[lower]) return ICON_MAP[lower];
  // Try partial match
  for (const key of Object.keys(ICON_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return ICON_MAP[key];
  }
  return Home;
}

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return [];
}

export function usePropertiesTypes() {
  const { getToken } = useAuth();
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await LookupsAPI.getPropertyTypes(token);
        if (res.success && res.data) {
          const raw = extractArray(res.data);
          const mapped: PropertyType[] = raw.map((item: any) => ({
            id: String(item.id),
            name: item.name || '',
            label: item.name || item.label || '',
            icon: findIcon(item.name || ''),
          }));
          setPropertyTypes(mapped);
        }
      } catch (e) {
        console.error('Failed to fetch property types:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [getToken]);

  return { propertyTypes, loading };
}
