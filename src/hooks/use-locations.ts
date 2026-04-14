import { useState, useEffect } from 'react';
import { LookupsAPI } from '@/lib/api/backend-api';

interface Location {
  id: number | string;
  name: string;
}

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    // Look for common keys: data, states, cities, villages, countries, etc.
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return [];
}

export function useCountries() {
  const [countries, setCountries] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await LookupsAPI.getCountries();
        if (res.success && res.data) {
          setCountries(extractArray(res.data));
        }
      } catch (e) {
        console.error('Failed to fetch countries:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { countries, isLoading };
}

export function useStates(countryId: string) {
  const [states, setStates] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!countryId) {
      setStates([]);
      return;
    }
    setIsLoading(true);
    const fetch = async () => {
      try {
        const res = await LookupsAPI.getStates(countryId);
        if (res.success && res.data) {
          setStates(extractArray(res.data));
        }
      } catch (e) {
        console.error('Failed to fetch states:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [countryId]);

  return { states, isLoading };
}

export function useCities(stateId: string) {
  const [cities, setCities] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stateId) {
      setCities([]);
      return;
    }
    setIsLoading(true);
    const fetch = async () => {
      try {
        const res = await LookupsAPI.getCities(stateId);
        if (res.success && res.data) {
          setCities(extractArray(res.data));
        }
      } catch (e) {
        console.error('Failed to fetch cities:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [stateId]);

  return { cities, isLoading };
}

export function useVillages(cityId: string) {
  const [villages, setVillages] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!cityId) {
      setVillages([]);
      return;
    }
    setIsLoading(true);
    const fetch = async () => {
      try {
        const res = await LookupsAPI.getVillages(cityId);
        if (res.success && res.data) {
          setVillages(extractArray(res.data));
        }
      } catch (e) {
        console.error('Failed to fetch villages:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [cityId]);

  return { villages, isLoading };
}
