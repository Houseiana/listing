export interface CancellationPolicy {
  policyType: 'FLEXIBLE' | 'MODERATE' | 'FIXED';
  freeCancellationHours: number | null;
  freeCancellationDays: number | null;
}

export interface DocumentOfProperty {
  PrpopertyDocoument: File | string | null;
  HostId: File | string | null;
  PowerOfAttorney: File | string | null;
}

export interface PropertyFormData {
  propertyType: string;
  country: string;
  countryName?: string;
  street: string;
  apt: string;
  city: string;
  cityName?: string;
  state: string;
  postalCode: string;
  villageId: string;
  area: string;
  buildingNumber: string;
  floorNumber: string;
  unitNumber: string;
  latitude: number;
  longitude: number;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  area_size: number;
  amenities: number[];
  safetyItems: number[];
  guestFavorites: number[];
  coverPhoto: File | string | null;
  photos: (File | string)[];
  title: string;
  description: string;
  highlights: number[];
  stars: number;
  cancellationPolicy: CancellationPolicy;
  cleaningFee: number;
  electricalFee: number;
  waterFee: number;
  basePrice: number;
  weeklyDiscount: number;
  monthlyDiscount: number;
  newListingDiscount: number;
  instantBook: boolean;
  minimumDaysForBooking: number;
  securityCamera: boolean;
  noiseMonitor: boolean;
  weapons: boolean;
  allowPets: boolean;
  allowSmoking: boolean;
  allowParties: boolean;
  allowGuests: boolean;
  allowMarriedOnly: boolean;
  checkInTime: string;
  checkOutTime: string;
  phoneNumber: string;
  emergencyPhoneNumber: string;
  isPropertyOwner: boolean;
  managedBy: boolean;
  documentOfProperty: DocumentOfProperty;
}
