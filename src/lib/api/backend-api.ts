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

export const UserPropertiesAPI = {
  searchByPhone(phone: string, token: string, signal?: AbortSignal) {
    return request(`/api/sales-dashboard/user-properties?phone=${encodeURIComponent(phone)}`, {
      headers: authHeader(token),
      signal,
    });
  },

  getDetails(propertyId: string, token: string) {
    return request(`/api/sales-dashboard/property-details?propertyId=${encodeURIComponent(propertyId)}`, {
      headers: authHeader(token),
    });
  },

  getUnavailableDates(propertyId: string, token: string, signal?: AbortSignal) {
    return request(`/api/sales-dashboard/properties/${encodeURIComponent(propertyId)}/unavailable-dates`, {
      headers: authHeader(token),
      signal,
    });
  },

  getSpecialPriceDays(propertyId: string, year: number, token: string, signal?: AbortSignal) {
    return request(`/api/sales-dashboard/special-price-days?propertyId=${encodeURIComponent(propertyId)}&year=${year}`, {
      headers: authHeader(token),
      signal,
    });
  },

  setSpecialPrice(
    payload: { adminId: string; propertyId: string; fromDate: string; toDate: string; price: number },
    token: string
  ) {
    return request('/api/sales-dashboard/special-price', {
      method: 'POST',
      headers: {
        ...authHeader(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  updateCalendarStatus(
    payload: {
      propertyId: string;
      userId: string;
      fromDate: string;
      toDate: string;
      status: 'NONE' | 'Blocked';
      reasonId: number;
      reasonText: string;
    },
    token: string
  ) {
    return request('/api/sales-dashboard/calendar/update-status', {
      method: 'POST',
      headers: {
        ...authHeader(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  getBlockReasons(token: string) {
    return request('/api/SalesDashboardLookup/ReasonBlockProperty', {
      headers: authHeader(token),
    });
  },

  editProperty(formData: FormData, token: string) {
    return request('/api/sales-dashboard/edit-property', {
      method: 'POST',
      headers: authHeader(token),
      body: formData,
    });
  },

  getAmenitiesLookup(token: string) {
    return request('/api/SalesDashboardLookup/Amenities', {
      headers: authHeader(token),
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

export const AdminsAPI = {
  getPropertyCount(adminId: string, token: string, signal?: AbortSignal) {
    return request<{ count?: number; propertyCount?: number } | number>(
      `/api/sales-dashboard/admins/${encodeURIComponent(adminId)}/property-count`,
      {
        headers: authHeader(token),
        signal,
      }
    );
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
