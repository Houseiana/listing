import { defaultLocale, LOCALE_COOKIE, type Locale } from '@/lib/i18n/config';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';

const getCurrentLocale = (): Locale => {
  if (typeof document === 'undefined') return defaultLocale;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  const value = match ? decodeURIComponent(match[1]) : '';
  return value === 'en' || value === 'ar' ? value : defaultLocale;
};

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const locale = getCurrentLocale();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Lang': locale,
        'X-Locale': locale,
        ...options.headers,
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        data,
        error: data?.message || `Request failed with status ${res.status}`,
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const PropertyAPI = {
  create(formData: FormData, token: string) {
    return request('/api/sales-dashboard/draft', {
      method: 'POST',
      headers: authHeader(token),
      body: formData,
    });
  },

  getById(id: string, token: string) {
    return request(`/api/properties/${id}`, {
      headers: authHeader(token),
    });
  },

  update(id: string, formData: FormData, token: string) {
    return request(`/api/properties/${id}`, {
      method: 'PUT',
      headers: authHeader(token),
      body: formData,
    });
  },
};

export const UsersAPI = {
  search(query: string, token: string) {
    return request(`/api/sales-dashboard/users/search?query=${encodeURIComponent(query)}`, {
      headers: authHeader(token),
    });
  },

  sendInvitation(email: string, token: string) {
    return request('/api/sales-dashboard/users/send-invitation', {
      method: 'POST',
      headers: {
        ...authHeader(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
  },

  upsertClerk(
    payload: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      countryCode: string;
      phone: string;
      CreateByPhone: boolean;
    },
    token: string
  ) {
    return request('/api/sales-dashboard/users/upsert-clerk', {
      method: 'POST',
      headers: {
        ...authHeader(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },
};

export const LookupsAPI = {
  getPropertyTypes(token: string) {
    return request('/api/Lookups/PropertyType', { headers: authHeader(token) });
  },

  getAmenities(token: string) {
    return request('/api/Lookups/Amenities', { headers: authHeader(token) });
  },

  getSafetyItems(token: string) {
    return request('/api/lookups/safety-items', { headers: authHeader(token) });
  },

  getGuestFavorites(token: string) {
    return request('/api/lookups/guest-favorites', { headers: authHeader(token) });
  },

  getPropertyHighlights(token: string) {
    return request('/api/Lookups/PropertyHighlight', { headers: authHeader(token) });
  },

  getCountries(token: string) {
    return request('/api/Lookups/country', { headers: authHeader(token) });
  },

  getStates(countryId: string, token: string) {
    return request(`/api/Lookups/states?countryId=${countryId}`, { headers: authHeader(token) });
  },

  getCities(stateId: string, token: string) {
    return request(`/api/Lookups/cities?stateId=${stateId}`, { headers: authHeader(token) });
  },

  getVillages(cityId: string, token: string) {
    return request(`/api/Lookups/villages?cityId=${cityId}`, { headers: authHeader(token) });
  },
};
