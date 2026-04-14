export interface ListingFormData {
  // Step 1: Category
  propertyType: string;

  // Step 2: Location
  country: string;
  city: string;
  state: string;
  street: string;
  postalCode: string;
  buildingNumber: string;
  floorNumber: string;
  unitNumber: string;

  // Step 3: Details
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  areaSize: number;
  title: string;
  description: string;
  amenities: string[];

  // Step 4: Images
  images: File[];

  // Step 5: Review (no additional fields — uses all above)
}

export const PROPERTY_TYPES = [
  { id: "apartment", label: "Apartment", icon: "Building2" },
  { id: "house", label: "House", icon: "Home" },
  { id: "villa", label: "Villa", icon: "Castle" },
  { id: "cabin", label: "Cabin", icon: "TreePine" },
  { id: "cottage", label: "Cottage", icon: "Fence" },
  { id: "townhouse", label: "Townhouse", icon: "Building" },
  { id: "loft", label: "Loft", icon: "Warehouse" },
  { id: "studio", label: "Studio", icon: "LayoutGrid" },
] as const;

export const AMENITIES_LIST = [
  "WiFi",
  "Air Conditioning",
  "Heating",
  "Kitchen",
  "Washer",
  "Dryer",
  "Free Parking",
  "Pool",
  "Hot Tub",
  "Gym",
  "TV",
  "Workspace",
  "Balcony",
  "Garden",
  "BBQ Grill",
  "Fire Pit",
  "Beach Access",
  "Mountain View",
  "Lake View",
  "City View",
] as const;

export const STEP_LABELS = [
  "Category",
  "Location",
  "Details",
  "Images",
  "Review",
] as const;
