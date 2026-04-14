import { useState, useEffect } from 'react';
import { LookupsAPI } from '@/lib/api/backend-api';
import {
  Home,
  Building2,
  Castle,
  TreePine,
  Warehouse,
  Hotel,
  Tent,
  LucideIcon,
} from 'lucide-react';

interface PropertyType {
  id: string;
  name: string;
  label: string;
  icon: LucideIcon;
}

const ICON_MAP: Record<string, LucideIcon> = {
  apartment: Building2,
  house: Home,
  villa: Castle,
  cabin: TreePine,
  cottage: TreePine,
  townhouse: Home,
  loft: Warehouse,
  studio: Hotel,
  chalet: TreePine,
  tent: Tent,
};

export function usePropertiesTypes() {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await LookupsAPI.getPropertyTypes();
        if (res.success && res.data) {
          const raw = Array.isArray(res.data) ? res.data : res.data.data || [];
          const mapped: PropertyType[] = raw.map((item: any) => ({
            id: String(item.id),
            name: item.name || '',
            label: item.name || item.label || '',
            icon:
              ICON_MAP[
                (item.name || '').toLowerCase().replace(/ /g, '_')
              ] || Home,
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
  }, []);

  return { propertyTypes, loading };
}
