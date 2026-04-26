const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';

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
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
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

export const PropertyAPI = {
  create(formData: FormData, token: string) {
    return request('/api/sales-dashboard/draft', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  },

  getById(id: string) {
    return request(`/api/properties/${id}`);
  },

  update(id: string, formData: FormData, token: string) {
    return request(`/api/properties/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  },
};

export const UsersAPI = {
  search(query: string, token: string) {
    return request(`/api/sales-dashboard/users/search?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  upsertClerk(
    payload: { email: string; firstName: string; lastName: string; phone: string },
    token: string
  ) {
    return request('/api/reservationAdmin/users/upsert-clerk', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },
};

export const LookupsAPI = {
  getPropertyTypes() {
    return request('/api/Lookups/PropertyType');
  },

  getAmenities() {
    return request('/api/Lookups/Amenities');
  },

  getSafetyItems() {
    return request('/api/lookups/safety-items');
  },

  getGuestFavorites() {
    return request('/api/lookups/guest-favorites');
  },

  getPropertyHighlights() {
    return request('/api/Lookups/PropertyHighlight');
  },

  getCountries() {
    return request('/api/Lookups/country');
  },

  getStates(countryId: string) {
    return request(`/api/Lookups/states?countryId=${countryId}`);
  },

  getCities(stateId: string) {
    return request(`/api/Lookups/cities?stateId=${stateId}`);
  },

  getVillages(cityId: string) {
    return request(`/api/Lookups/villages?cityId=${cityId}`);
  },
};
