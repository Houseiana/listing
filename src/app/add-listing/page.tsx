'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PropertyAPI, UsersAPI } from '@/lib/api/backend-api';
import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import Swal from 'sweetalert2';
import { MapPin, Navigation, PenLine, Search, User, UserPlus, X, ArrowLeft } from 'lucide-react';
import { stripArabicNumerals, blockArabicNumeralKey } from '@/lib/utils/numeric-input';
import { PropertyFormData } from '@/app/types';
import {
  PropertyTypeStep,
  LocationStep,
  BasicsStep,
  AmenitiesStep,
  PhotosStep,
  TitleStep,
  PricingStep,
  DiscountsStep,
  LegalStep,
  HouseRulesStep,
  ReviewStep,
  CancellationPolicyStep,
  DocumentsStep,
} from '@/app/components';
import { validateRoomCounts } from '@/lib/utils/room-validation';
import { useCountries, useCities } from '@/hooks/use-locations';
import Image from 'next/image';

const libraries: 'places'[] = ['places'];

export default function AddListingPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div></div>}>
      <AddListingPage />
    </Suspense>
  );
}

function AddListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('id');
  const [newPropertyId, setNewPropertyId] = useState(propertyId);
  const { getToken, userId, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { countries } = useCountries();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(!propertyId);
  const [locationSubStep, setLocationSubStep] = useState(0); // 0 = choose method, 1 = manual form

  // User selection state
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add new user form state
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [newUserErrors, setNewUserErrors] = useState<Record<string, string>>({});

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced user search
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      return;
    }
    setIsSearchingUsers(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await UsersAPI.search(query, token);
      if (res.success && res.data) {
        const users = Array.isArray(res.data) ? res.data : res.data.data || [];
        setUserSearchResults(users);
        setShowUserDropdown(users.length > 0);
      }
    } catch (e) {
      console.error('User search failed:', e);
    } finally {
      setIsSearchingUsers(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchUsers(userSearchQuery), 400);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [userSearchQuery, searchUsers]);

  const resetAddUserForm = () => {
    setNewUserForm({ firstName: '', lastName: '', email: '', phone: '' });
    setNewUserErrors({});
  };

  const handleCreateUser = async () => {
    const errors: Record<string, string> = {};
    const firstName = newUserForm.firstName.trim();
    const lastName = newUserForm.lastName.trim();
    const email = newUserForm.email.trim();
    const phone = newUserForm.phone.trim();

    if (!firstName) errors.firstName = 'First name is required';
    if (!lastName) errors.lastName = 'Last name is required';
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!phone) {
      errors.phone = 'Phone number is required';
    } else if (phone.length < 6) {
      errors.phone = 'Phone number is too short';
    }

    if (Object.keys(errors).length > 0) {
      setNewUserErrors(errors);
      return;
    }
    setNewUserErrors({});

    setIsCreatingUser(true);
    try {
      const token = await getToken();
      if (!token) {
        await Swal.fire({
          icon: 'error',
          title: 'Authentication Required',
          text: 'Please sign in to create a user.',
          confirmButtonColor: '#000',
        });
        return;
      }

      const res = await UsersAPI.upsertClerk(
        { email, firstName, lastName, phone },
        token
      );

      if (res.success && res.data) {
        const raw = res.data as Record<string, unknown>;
        const user = (raw.data as Record<string, unknown> | undefined) || raw;
        const id = user?.id ?? user?.userId ?? user?.clerkId;
        if (!id) {
          await Swal.fire({
            icon: 'error',
            title: 'Could not create user',
            text: 'The server did not return a valid user. Please try again.',
            confirmButtonColor: '#000',
          });
          return;
        }
        const fullName = `${firstName} ${lastName}`.trim();
        setSelectedUser({ id: String(id), name: fullName, email });
        setShowAddUserForm(false);
        resetAddUserForm();
        await Swal.fire({
          icon: 'success',
          title: 'User created',
          text: `${fullName} has been added.`,
          confirmButtonColor: '#10B981',
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        const errData = res.data as { message?: string } | undefined;
        const message = errData?.message || res.error || 'Failed to create user. Please try again.';
        await Swal.fire({
          icon: 'error',
          title: 'Could not create user',
          text: message,
          confirmButtonColor: '#000',
        });
      }
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'Could not create user',
        text: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
        confirmButtonColor: '#000',
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const [currency, setCurrency] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const [listing, setListing] = useState<PropertyFormData>({
    propertyType: '',
    country: '',
    street: '',
    apt: '',
    city: '',
    state: '',
    postalCode: '',
    villageId: '',
    area: '',
    buildingNumber: '',
    floorNumber: '',
    unitNumber: '',
    latitude: 30.0444,
    longitude: 31.2357,
    guests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    area_size: 25,
    amenities: [],
    safetyItems: [],
    guestFavorites: [],
    coverPhoto: null,
    photos: [],
    title: '',
    description: '',
    highlights: [],
    stars: 0,
    cancellationPolicy: {
      policyType: 'FLEXIBLE',
      freeCancellationHours: 24,
      freeCancellationDays: null,
    },
    cleaningFee: 0,
    electricalFee: 0,
    waterFee: 0,
    basePrice: 0,
    weeklyDiscount: 0,
    monthlyDiscount: 0,
    newListingDiscount: 0,
    instantBook: true,
    securityCamera: false,
    noiseMonitor: false,
    weapons: false,
    allowPets: false,
    allowSmoking: false,
    allowParties: false,
    allowGuests: true,
    allowMarriedOnly: false,
    checkInTime: '3:00 PM',
    checkOutTime: '11:00 AM',
    phoneNumber: '',
    emergencyPhoneNumber: '',
    isPropertyOwner: true,
    documentOfProperty: {
      PrpopertyDocoument: null,
      HostId: null,
      PowerOfAttorney: null,
    },
  });

  const { cities } = useCities(listing.country);


  // Fetch data for Edit Mode
  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!propertyId) return;

      setLoading(true);
      try {
        const response = await PropertyAPI.getById(propertyId);
        if (response.success && response.data) {
          const rawData = response.data as any;
          // Handle potential double nesting (response.data.data) or direct access
          const property = rawData.data || rawData;
          console.log('[EditDraft] property raw:', { propertyTypeId: property.propertyTypeId, propertyType: property.propertyType, city: property.city, cityId: property.cityId, addressCity: property.address?.city, addressCityId: property.address?.cityId, country: property.country, addressName: property.address?.name });

          // Helper to safely parse JSON or return as is
          const parseSafe = (val: any) => {
            if (typeof val === 'string') {
              try {
                return JSON.parse(val);
              } catch {
                return [];
              }
            }
            return Array.isArray(val) ? val : [];
          };

          // Helper to extract IDs from arrays that may contain objects or plain IDs
          const extractIds = (val: any): number[] => {
            const arr = parseSafe(val);
            return arr
              .map((item: any) =>
                typeof item === 'number'
                  ? item
                  : typeof item === 'object' && item !== null
                    ? item.id ?? item.amenityId ?? item.itemId
                    : typeof item === 'string' && !isNaN(Number(item))
                      ? Number(item)
                      : null
              )
              .filter((id: any): id is number => id !== null && id !== undefined);
          };

          const amenities = extractIds(property.amenities);
          const safetyItems = extractIds(property.safetyItems || property.safety_items);
          const guestFavorites = extractIds(property.guestFavorites || property.guest_favorites);
          const highlights = extractIds(property.highlights || property.propertyHighlights);

          // Parse photos - handle arrays of strings, arrays of objects, JSON strings, single URLs
          const rawPhotos = property.photos || property.images;
          let images: string[] = [];
          if (Array.isArray(rawPhotos)) {
            images = rawPhotos
              .map((p: any) =>
                typeof p === 'string' ? p : p?.url || p?.fileUrl || p?.path || ''
              )
              .filter(Boolean);
          } else if (typeof rawPhotos === 'string') {
            try {
              const parsed = JSON.parse(rawPhotos);
              images = Array.isArray(parsed)
                ? parsed
                    .map((p: any) =>
                      typeof p === 'string' ? p : p?.url || p?.fileUrl || p?.path || ''
                    )
                    .filter(Boolean)
                : [rawPhotos];
            } catch {
              // Single URL string
              if (rawPhotos.startsWith('http')) {
                images = [rawPhotos];
              }
            }
          }

          // Map API response to PropertyFormData
          setListing((prev) => ({
            ...prev,
            title: property.title || '',
            description: property.description || '',
            // In edit/draft mode: prefer propertyTypeId, fallback to propertyType object id, then raw string
            propertyType: property.propertyTypeId
              || (typeof property.propertyType === 'object' && property.propertyType !== null
                  ? String(property.propertyType?.id || property.propertyType?.name || '')
                  : String(property.propertyType || '')),
            // Address mapping: address.name -> country, address.streetAddress -> street
            country: property.address?.name || property.country || '1',
            city: (() => {
              const cityVal = property.city ?? property.cityId ?? property.address?.cityId ?? property.address?.city;
              if (!cityVal) return '';
              if (typeof cityVal === 'object') return String(cityVal?.id || '');
              return String(cityVal);
            })(),
            street:
              typeof property.address === 'object'
                ? property.address?.streetAddress || ''
                : property.address || '',
            basePrice: property.pricePerNight || property.price || 0,

            // Map other fields as available/needed
            guests: property.guests || 4,
            bedrooms: property.bedrooms || 2,
            beds: property.beds || property.bedrooms || 1,
            bathrooms: property.bathrooms || 1,
            area_size: property.sizeOfProperty ?? property.area_size ?? property.areaSize ?? 25,
            amenities: amenities,
            safetyItems: safetyItems,
            guestFavorites: guestFavorites,
            highlights: highlights,
            photos: images,

            // Pricing
            cleaningFee: property.cleaningFee || property.cleaning_fee || 0,
            electricalFee: property.electricalFee || property.electrical_fee || 0,
            waterFee: property.waterFee || property.water_fee || 0,
            weeklyDiscount: property.weeklyDiscount || property.weekly_discount || 0,
            monthlyDiscount: property.monthlyDiscount || property.monthly_discount || 0,
            newListingDiscount: property.newListingDiscount || property.new_listing_discount || 0,

            // Stars / Rating
            stars: property.stars || property.rating || undefined,

            // House rules
            instantBook: property.instantBook ?? property.instant_book ?? false,
            securityCamera: property.securityCamera ?? property.security_camera ?? false,
            noiseMonitor: property.noiseMonitor ?? property.noise_monitor ?? false,
            weapons: property.weapons ?? false,
            allowPets: property.allowPets ?? property.allow_pets ?? false,
            allowSmoking: property.allowSmoking ?? property.allow_smoking ?? false,
            allowParties: property.allowParties ?? property.allow_parties ?? false,
            allowGuests: property.allowGuests ?? true,
            allowMarriedOnly: property.allowMarriedOnly ?? false,

            // Check-in/out times
            checkInTime: property.checkInTime || property.check_in_time || '',
            checkOutTime: property.checkOutTime || property.check_out_time || '',

            // Owner status
            isPropertyOwner: property.isPropertyOwner ?? property.is_property_owner ?? true,

            // Location details
            apt: property.apt || property.address?.apt || '',
            villageId: property.address?.villageId ? String(property.address.villageId) : '',
            area: property.address?.area || '',
            buildingNumber: property.address?.buildingNumber || '',
            floorNumber: property.address?.floorNumber ? String(property.address.floorNumber) : '',
            unitNumber: property.address?.unitNumber ? String(property.address.unitNumber) : '',
            state: property.state || property.address?.state || '',
            postalCode: property.postalCode || property.postal_code || property.address?.postalCode || '',
            latitude: property.latitude || property.lat || 0,
            longitude: property.longitude || property.lng || property.lon || 0,

            // Cancellation Policy mapping
            cancellationPolicy: property.propertyCancellationPolicy ||
              property.cancellationPolicy || {
                policyType: 'FLEXIBLE',
                freeCancellationHours: null,
                freeCancellationDays: null,
              },

            // Documents mapping - handle URL strings or objects with url field
            documentOfProperty: {
              PrpopertyDocoument:
                property.documentOfProperty?.prpopertyDocoument ||
                property.documentOfProperty?.PrpopertyDocoument ||
                property.propertyDocument ||
                null,
              HostId:
                property.documentOfProperty?.hostId ||
                property.documentOfProperty?.HostId ||
                property.hostIdDocument ||
                null,
              PowerOfAttorney:
                property.documentOfProperty?.powerOfAttorney ||
                property.documentOfProperty?.PowerOfAttorney ||
                property.powerOfAttorney ||
                null,
            },
          }));

          // Set currency from loaded property
          if (property.currency) {
            setCurrency(property.currency);
          }

          // In edit mode: go to saved step, or last step (review) if no stepDraft
          if (property.stepDraft !== undefined && property.stepDraft !== null) {
            setCurrentStep(Math.min(property.stepDraft, steps.length - 1));
          } else {
            setCurrentStep(steps.length - 1);
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load property data. Please try again.',
          });
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load property data. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchPropertyData();
    }
  }, [propertyId]);

  const { isLoaded: isMapLoaded } = useLoadScript({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const steps = [
    { id: 0, phase: 1, title: 'Property Type', subtitle: 'Choose your property type' },
    { id: 1, phase: 1, title: 'Location', subtitle: 'Where is your property located?' },
    { id: 2, phase: 1, title: 'Room Details', subtitle: 'Tell us about the rooms' },
    { id: 3, phase: 2, title: 'Amenities', subtitle: 'What amenities do you offer?' },
    { id: 4, phase: 2, title: 'House Rules', subtitle: 'Set your house rules' },
    { id: 5, phase: 2, title: 'Photos', subtitle: 'Show off your property' },
    { id: 6, phase: 3, title: 'Title & Description', subtitle: 'Describe your property' },
    { id: 7, phase: 3, title: 'Classification & Pricing', subtitle: 'Set your pricing' },
    { id: 8, phase: 3, title: 'Discounts', subtitle: 'Offer discounts to attract guests' },
    { id: 9, phase: 3, title: 'Cancellation Policy', subtitle: 'Choose your cancellation policy' },
    { id: 10, phase: 3, title: 'Legal & Booking', subtitle: 'Booking and legal settings' },
    { id: 11, phase: 3, title: 'Documents', subtitle: 'Upload required documents' },
    { id: 12, phase: 3, title: 'Review', subtitle: 'Review your listing' },
  ];

  const phases = [
    { id: 1, title: 'Property Basics', steps: [0, 1, 2] },
    { id: 2, title: 'Property Details', steps: [3, 4, 5] },
    { id: 3, title: 'Finalize', steps: [6, 7, 8, 9, 10, 11, 12] },
  ];

  // Enhanced validation function with detailed error tracking
  const validateStep = async (step: number, showAlert: boolean = true): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
    const errors: Record<string, string> = {};
    let missingFields: string[] = [];

    switch (step) {
      case 0: // Property Type
        if (!listing.propertyType) {
          errors.propertyType = 'Property type is required';
          missingFields.push('property type');
        }
        break;

      case 1: // Location
        if (!listing.country) {
          errors.country = 'Country is required';
          missingFields.push('country');
        }
        if (!listing.city) {
          errors.city = 'City is required';
          missingFields.push('city');
        }
        if (!listing.street) {
          errors.street = 'Street address is required';
          missingFields.push('street address');
        }
        {
          const countryName = countries.find((c) => String(c.id) === String(listing.country))?.name || '';
          if (countryName.toLowerCase().includes('egypt') && !listing.postalCode) {
            errors.postalCode = 'Postal code is required for Egypt';
            missingFields.push('postal code');
          }
        }
        break;

      case 2: // Basics - Enhanced validation
        if (listing.guests < 1) {
          errors.guests = 'At least 1 guest must be allowed';
        }
        if (listing.bedrooms < 1) {
          errors.bedrooms = 'At least 1 bedroom is required';
          missingFields.push('bedroom count');
        }
        if (listing.beds < 1) {
          errors.beds = 'At least 1 bed is required';
          missingFields.push('bed count');
        }
        if (listing.bathrooms < 1) {
          errors.bathrooms = 'At least 1 bathroom is required';
          missingFields.push('bathroom count');
        }

        // Cross-validation
        if (listing.bedrooms > listing.guests) {
          errors.bedrooms = 'Number of bedrooms cannot exceed guest capacity';
        }
        if (listing.beds > listing.guests) {
          errors.beds = 'Number of beds cannot exceed guest capacity';
        }
        if (listing.guests > listing.beds * 2) {
          errors.guests = `With ${listing.beds} beds, maximum capacity is ${listing.beds * 2} guests`;
        }
        if (listing.beds < listing.bedrooms) {
          errors.beds = 'Each bedroom must have at least one bed';
        }
        if (listing.bathrooms > 5) {
          errors.bathrooms = 'Maximum 5 bathrooms allowed';
        }
        break;

      case 3: // Amenities (optional step, no validation required)
        break;

      case 4: // House Rules
        if (!listing.checkInTime) {
          errors.checkInTime = 'Check-in time is required';
          missingFields.push('check-in time');
        }
        if (!listing.checkOutTime) {
          errors.checkOutTime = 'Check-out time is required';
          missingFields.push('check-out time');
        }
        break;

      case 5: // Photos
        if (listing.photos.length < 5) {
          errors.photos = `${listing.photos.length}/5 photos required`;
          missingFields.push(`${5 - listing.photos.length} more photos needed`);
        }
        break;

      case 6: // Title + Description
        if (!listing.title.trim()) {
          errors.title = 'Property title is required';
          missingFields.push('property title');
        } else if (listing.title.trim().length < 10) {
          errors.title = 'Title must be at least 10 characters long';
        }
        if (!listing.description.trim()) {
          errors.description = 'Property description is required';
          missingFields.push('property description');
        } else if (listing.description.trim().length < 50) {
          errors.description = 'Description must be at least 50 characters long';
        }
        break;

      case 7: // Classification + Pricing
        if (!listing.stars || listing.stars === 0) {
          errors.stars = 'Please rate your property';
          missingFields.push('property rating');
        }
        const isEGP = currency === 'EGP';
        const minBasePrice = isEGP ? 1000 : 20;
        const maxBasePrice = isEGP ? 50000 : 10000;
        const maxCleaningFee = isEGP ? 2500 : 35;
        const currencySymbol = isEGP ? 'EGP' : 'EGP';
        if (!listing.basePrice || listing.basePrice < minBasePrice) {
          errors.basePrice = `Minimum price is ${currencySymbol} ${minBasePrice.toLocaleString()}`;
          missingFields.push('base price');
        } else if (listing.basePrice > maxBasePrice) {
          errors.basePrice = `Maximum price is ${currencySymbol} ${maxBasePrice.toLocaleString()}`;
        }
        if ((listing.cleaningFee || 0) > maxCleaningFee) {
          errors.cleaningFee = `Cleaning fee cannot exceed ${currencySymbol}${maxCleaningFee.toLocaleString()}`;
        } else if (isEGP && (listing.cleaningFee || 0) > (listing.basePrice || 0)) {
          errors.cleaningFee = 'Cleaning fee cannot exceed the nightly rate';
        }
        break;

      case 8: // Discounts (optional step)
        break;

      case 9: // Cancellation Policy
        if (!listing.cancellationPolicy?.policyType) {
          errors.cancellationPolicy = 'Please select a cancellation policy';
          missingFields.push('cancellation policy');
        }
        break;

      case 10: // Legal/Booking Settings
        if (!listing.phoneNumber || listing.phoneNumber.trim().length < 6) {
          errors.phoneNumber = 'Phone number is required';
          missingFields.push('phone number');
        }
        break;

      case 11: // Documents — Host ID & Property Document are optional
        if (!listing.isPropertyOwner && !listing.documentOfProperty.PowerOfAttorney) {
          errors.powerOfAttorney = 'Power of Attorney is required for non-owners';
          missingFields.push('power of attorney');
        }
        break;

      default:
        break;
    }

    const isValid = Object.keys(errors).length === 0;

    // Show user-friendly alert if validation fails and showAlert is true
    if (!isValid && showAlert) {
      let alertTitle = '';
      let alertText = '';

      if (missingFields.length > 0) {
        alertTitle = 'Please complete required fields';
        alertText = missingFields.map(field => `• ${field}`).join('\n');
      } else {
        alertTitle = 'Please fix the errors below';
        alertText = Object.values(errors).join('\n• ');
      }

      await Swal.fire({
        icon: 'warning',
        title: alertTitle,
        text: alertText,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'Got it',
        customClass: {
          popup: 'text-left',
        }
      });
    }

    return { isValid, errors };
  };

  // In edit mode, don't allow going back to step 0 (property type selection)
  const minStep = propertyId ? 1 : 0;

  const handleBack = () => {
    // If on location manual form, go back to location choose screen
    if (currentStep === 1 && locationSubStep === 1) {
      setLocationSubStep(0);
      return;
    }
    if (currentStep > minStep) {
      setCurrentStep(currentStep - 1);
      // Reset location sub-step when navigating away
      if (currentStep === 2) setLocationSubStep(0);
    }
  };

  const updateCounter = (field: keyof PropertyFormData, delta: number) => {
    const min = field === 'bathrooms' ? 1 : 1;
    const currentValue = (listing[field] as number) || 0;
    const newValue = Math.max(min, currentValue + delta);
    setListing({ ...listing, [field]: newValue });
  };

  const saveStepDraft = async (nextStep: number): Promise<{ ok: boolean; message?: string }> => {
    if (!userId) return { ok: false, message: 'Authentication required' };
    if (!selectedUser?.id) {
      setShowIntro(true);
      return { ok: false, message: '' };
    }

    try {
      const formData = new FormData();
      formData.append('stepDraft', nextStep.toString());

      // Use newPropertyId from state OR propertyId from URL
      const effectivePropertyId = newPropertyId || propertyId;
      if (effectivePropertyId) {
        formData.append('propertyId', effectivePropertyId);
      }
      formData.append('hostId', selectedUser.id);
      formData.append('adminId', userId);

      if (currentStep === 0) {
        formData.append('propertyType.id', listing.propertyType || '');
      }

      if (currentStep === 1) {
        // Address - Nested
        formData.append('address.name', listing.country || 'Qatar');
        formData.append('address.cityId', listing.city || '');
        formData.append('address.zipCode', listing.postalCode || '');

        const lat = listing.latitude || 0;
        const lng = listing.longitude || 0;
        formData.append('address.latitude', lat.toString());
        formData.append('address.longitude', lng.toString());

        formData.append('address.streetAddress', listing.street || '');
        formData.append('address.villageId', listing.villageId || '0');
        formData.append('address.area', listing.area || '');
        formData.append('address.buildingNumber', listing.buildingNumber || '');
        formData.append('address.floorNumber', listing.floorNumber || '0');
        formData.append('address.unitNumber', listing.unitNumber || '0');
      }

      if (currentStep === 2) {
        // Room Details - Nested
        formData.append('roomDetails.guests', (listing.guests || 0).toString());
        formData.append(
          'roomDetails.bedrooms',
          (listing.bedrooms || 0).toString()
        );
        formData.append('roomDetails.beds', (listing.beds || 0).toString());
        formData.append(
          'roomDetails.bathrooms',
          (listing.bathrooms || 0).toString()
        );
        formData.append(
          'roomDetails.area_size',
          (listing.area_size ?? 25).toString()
        );
      }

      if (currentStep === 3) {
        // Amenities
        if (listing.amenities && listing.amenities.length > 0) {
          listing.amenities.forEach((amenity: any) => {
            formData.append('amenities', amenity.toString());
          });
        }
        // Safety
        if (listing.safetyItems && listing.safetyItems.length > 0) {
          listing.safetyItems.forEach((safetyItem: any) => {
            formData.append('safetyItems', safetyItem.toString());
          });
        }
        // guestFavorites
        if (listing.guestFavorites && listing.guestFavorites.length > 0) {
          listing.guestFavorites.forEach((guestFavorite: any) => {
            formData.append('guestFavorites', guestFavorite.toString());
          });
        }
      }

      if (currentStep === 4) {
        // House Rules - Nested
        formData.append('houseRules.allowPets', String(listing.allowPets));
        formData.append(
          'houseRules.allowSmoking',
          String(listing.allowSmoking)
        );
        formData.append('houseRules.allowEvents', String(listing.allowParties));
        formData.append('houseRules.checkInTime', listing.checkInTime || '');
        formData.append('houseRules.checkOutTime', listing.checkOutTime || '');
        formData.append('houseRules.allowGuests', String(listing.allowGuests));
        formData.append('houseRules.allowMarriedOnly', String(listing.allowMarriedOnly));
      }

      if (currentStep === 5) {
        // Cover Photo
        if (listing.coverPhoto) {
          if (listing.coverPhoto instanceof File) {
            formData.append('coverPhoto', listing.coverPhoto);
          } else if (typeof listing.coverPhoto === 'string') {
            formData.append('existingCoverPhoto', listing.coverPhoto);
          }
        }

        // Photos
        if (listing.photos && listing.photos.length > 0) {
          listing.photos.forEach((photo) => {
            if (photo instanceof File) {
              formData.append('photos', photo);
            } else if (typeof photo === 'string' && photo) {
              // Send existing photo URLs so backend knows to keep them
              formData.append('existingPhotos', photo);
            }
          });
        }
      }

      if (currentStep === 6) {
        // Title + Description + Highlights
        formData.append('title', listing.title || '');
        formData.append('description.description', listing.description || '');
        if (listing.highlights && listing.highlights.length > 0) {
          listing.highlights.forEach((highlight: any) => {
            formData.append(
              'description.propertyHighlight',
              highlight.toString()
            );
          });
        }
      }

      if (currentStep === 7) {
        // Classification + Pricing
        if (listing.stars) {
          formData.append('stars', listing.stars.toString());
        }
        formData.append(
          'pricing.pricePerNight',
          (listing.basePrice || 0).toString()
        );
        formData.append(
          'pricing.cleaningFee',
          (listing.cleaningFee || 0).toString()
        );
        formData.append(
          'pricing.electricalFee',
          (listing.electricalFee || 0).toString()
        );
        formData.append(
          'pricing.waterFee',
          (listing.waterFee || 0).toString()
        );
        formData.append('pricing.serviceFee', '0');
      }

      if (currentStep === 8) {
        // Discount - Nested
        formData.append(
          'discount.newListingDiscount',
          (listing.newListingDiscount || 0).toString()
        );
        formData.append(
          'discount.weeklyDiscount',
          (listing.weeklyDiscount || 0).toString()
        );
      }

      if (currentStep === 9) {
        // Cancelation Policy - Nested
        if (listing.cancellationPolicy) {
          const policyType = listing.cancellationPolicy.policyType || 'FLEXIBLE';
          formData.append('cancellationPolicy.policyType', policyType);
          if (policyType === 'FLEXIBLE') {
            formData.append(
              'cancellationPolicy.freeCancellationHours',
              String(listing.cancellationPolicy.freeCancellationHours || 24)
            );
          } else if (policyType === 'MODERATE') {
            formData.append(
              'cancellationPolicy.freeCancellationDays',
              String(listing.cancellationPolicy.freeCancellationDays || 5)
            );
          }
        }
      }

      if (currentStep === 10) {
        // Booking Settings - Nested
        formData.append(
          'bookingSettings.instantBook',
          String(listing.instantBook)
        );
        formData.append(
          'bookingSettings.securitCamera',
          String(listing.securityCamera)
        );
        formData.append(
          'bookingSettings.noiseDecibelMonitor',
          String(listing.noiseMonitor)
        );
        if (listing.phoneNumber) {
          formData.append('phoneNumber', listing.phoneNumber);
        }
        if (listing.emergencyPhoneNumber) {
          formData.append('emergencyPhoneNumber', listing.emergencyPhoneNumber);
        }
      }

      if (currentStep === 11) {
        // Handle documents - send File objects as uploads, existing URLs as strings
        const doc = listing.documentOfProperty;
        if (doc.PrpopertyDocoument instanceof File) {
          formData.append('documentOfProperty.prpopertyDocoument', doc.PrpopertyDocoument);
        } else if (typeof doc.PrpopertyDocoument === 'string' && doc.PrpopertyDocoument) {
          formData.append('documentOfProperty.prpopertyDocoument', doc.PrpopertyDocoument);
        }
        if (doc.HostId instanceof File) {
          formData.append('documentOfProperty.hostId', doc.HostId);
        } else if (typeof doc.HostId === 'string' && doc.HostId) {
          formData.append('documentOfProperty.hostId', doc.HostId);
        }
        if (doc.PowerOfAttorney instanceof File) {
          formData.append('documentOfProperty.powerOfAttorney', doc.PowerOfAttorney);
        } else if (typeof doc.PowerOfAttorney === 'string' && doc.PowerOfAttorney) {
          formData.append('documentOfProperty.powerOfAttorney', doc.PowerOfAttorney);
        }
      }

      const clerkToken = await getToken();
      if (!clerkToken) return { ok: false, message: 'Authentication required' };

      const response = await PropertyAPI.create(formData as any, clerkToken);

      if (response.success && response.data) {
        const rawData = response.data as any;
        const data = rawData.data || rawData; // Handle potential Double nesting
        if (data.id && currentStep === 0) {
          setNewPropertyId(data.id);
        }
        if (rawData.currency) setCurrency(rawData.currency);
        return { ok: true };
      }
      // Extract error message from API response
      const errData = response.data as any;
      const apiMessage = errData?.message || response.error || 'Failed to save your progress. Please try again.';
      return { ok: false, message: apiMessage };
    } catch (error) {
      console.error('Error saving draft:', error);
      return { ok: false, message: error instanceof Error ? error.message : 'Failed to save your progress. Please try again.' };
    }
  };

  const handleNext = async () => {
    setHasAttemptedNext(true);

    const { isValid, errors } = await validateStep(currentStep, true);
    setValidationErrors(errors);

    if (isValid) {
      if (currentStep < steps.length - 1) {
        const nextStep = currentStep + 1;
        setIsSavingDraft(true);
        try {
          const result = await saveStepDraft(nextStep);
          if (!result.ok) {
            await Swal.fire({
              icon: 'error',
              title: 'Save Failed',
              text: result.message || 'Failed to save your progress. Please try again.',
              confirmButtonColor: '#000',
            });
            return;
          }
        } catch (e: any) {
          console.error('Draft save failed:', e);
          await Swal.fire({
            icon: 'error',
            title: 'Save Failed',
            text: 'Failed to save your progress. Please try again.',
            confirmButtonColor: '#000',
          });
          return;
        } finally {
          setIsSavingDraft(false);
        }
        // Clear validation errors and advance to next step
        setValidationErrors({});
        setHasAttemptedNext(false);
        setCurrentStep(nextStep);
      }
    }
  };

  // Clear validation errors when user makes changes
  const handleListingChange = (newListing: PropertyFormData) => {
    setListing(newListing);
    if (hasAttemptedNext) {
      // Re-validate silently to update error indicators in real-time
      validateStep(currentStep, false).then(({ errors }) => {
        setValidationErrors(errors);
      });
    }
  };

  const handleSubmit = async () => {
    if (!isAuthLoaded || !isSignedIn || !userId) {
      await Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'Please sign in to create a listing.',
        confirmButtonColor: '#000',
      });
      router.push('/sign-in');
      return;
    }

    if (!listing.title || !listing.description) {
      await Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        text: 'Please provide a title and description for your property.',
        confirmButtonColor: '#000',
      });
      setCurrentStep(5);
      return;
    }

    if (!listing.propertyType) {
      await Swal.fire({
        icon: 'error',
        title: 'Missing Property Type',
        text: 'Please select a property type.',
        confirmButtonColor: '#000',
      });
      setCurrentStep(0);
      return;
    }

    if (!listing.city || !listing.country) {
      await Swal.fire({
        icon: 'error',
        title: 'Incomplete Location',
        text: 'Please complete the location details for your property.',
        confirmButtonColor: '#000',
      });
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);

    try {
      // -----------------------------------------------------
      // EDIT MODE (Modify)
      // -----------------------------------------------------
      if (propertyId) {
        const result = await saveStepDraft(currentStep + 1);

        if (result.ok) {
          await Swal.fire({
            icon: 'success',
            title: 'Property Updated',
            text: `Your property "${listing.title}" has been updated successfully.`,
            confirmButtonColor: '#000',
          });
          router.push('/');
        } else {
          throw new Error(result.message || 'Failed to update property');
        }
        return;
      }

      // -----------------------------------------------------
      // CREATE MODE (Uses draft API: POST /api/properties/draft)
      // -----------------------------------------------------
      const result = await saveStepDraft(currentStep + 1);

      if (result.ok) {
        await Swal.fire({
          icon: 'success',
          title: `"${listing.title}" Created!`,
          text: 'Your property listing has been created successfully.',
          confirmButtonColor: '#000',
        });
        router.push('/');
      } else {
        throw new Error(result.message || 'Failed to add property');
      }
    } catch (error: any) {
      console.error('Error submitting property:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: `Something went wrong: ${error.message}`,
        confirmButtonColor: '#000',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPhase = phases.find((p) => p.steps.includes(currentStep));
  const phaseProgress = currentPhase
    ? ((currentPhase.steps.indexOf(currentStep) + 1) /
        currentPhase.steps.length) *
      100
    : 0;

  // Phase info for the left sidebar card
  const phaseInfo = [
    { illustration: '/images/listing/step1-illustration.svg', title: 'Tell us about your property', subtitle: 'Start with the basics - property type, location, and room details.' },
    { illustration: '/images/listing/step2-illustration.svg', title: 'Make your property stand out', subtitle: 'Add amenities, house rules, and photos to attract guests.' },
    { illustration: '/images/listing/step3-illustration.svg', title: 'Finalize your listing', subtitle: 'Set your pricing, policies, and review your listing before publishing.' },
  ];

  // Step-specific overrides for the left card
  const stepInfoOverrides: Record<number, { illustration: string; title: string; subtitle: string }> = {
    1:  { illustration: '/images/listing/location-illustration.svg',              title: 'Pin your location',              subtitle: 'Help guests find your property easily.' },
    4:  { illustration: '/images/listing/houserules-illustration.svg',            title: 'Set your house rules',           subtitle: 'Let guests know what to expect during their stay.' },
    6:  { illustration: '/images/listing/title-illustration-48a20e.png',          title: 'Give your place a title',        subtitle: 'A great title helps your listing stand out in search results.' },
    7:  { illustration: '/images/listing/pricing-illustration-332fe1.png',        title: 'Set your pricing',               subtitle: 'Choose a competitive price to attract your first guests.' },
    8:  { illustration: '/images/listing/discounts-illustration-791af2.png',      title: 'Offer discounts',                subtitle: 'Attract more guests with special discounts.' },
    9:  { illustration: '/images/listing/cancellation-illustration-5e4bee.png',   title: 'Cancellation policy',            subtitle: 'Choose a policy that works for you and your guests.' },
    10: { illustration: '/images/listing/legal-illustration.png',                 title: 'Legal & booking settings',       subtitle: 'Configure booking preferences and contact information.' },
    11: { illustration: '/images/listing/documents-illustration.svg',             title: 'Upload your documents',          subtitle: 'Provide required documents to verify your property.' },
    12: { illustration: '/images/listing/review-illustration.svg',                title: 'Review your listing',            subtitle: 'Make sure everything looks good before publishing.' },
  };

  const currentPhaseInfo = stepInfoOverrides[currentStep]
    || (currentPhase ? phaseInfo[(currentPhase.id || 1) - 1] : phaseInfo[0]);

  const renderStep = () => {
    const stepProps = {
      listing,
      setListing: handleListingChange,
      validationErrors,
      hasAttemptedNext,
    };

    switch (currentStep) {
      case 0:
        return <PropertyTypeStep {...stepProps} />;
      case 1:
        if (locationSubStep === 0) {
          // Location choose method screen
          return (
            <div className="relative w-full rounded-2xl overflow-hidden border border-[#F0F2F5] h-[480px]">
              {/* Map Background */}
              {isMapLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: listing.latitude, lng: listing.longitude }}
                  zoom={13}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    draggable: false,
                  }}
                >
                  <Marker
                    position={{ lat: listing.latitude, lng: listing.longitude }}
                  />
                </GoogleMap>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Loading map...</p>
                </div>
              )}

              {/* Overlay Card */}
              <div className="absolute inset-x-3 sm:inset-x-9 top-6 sm:top-10 bg-white rounded-2xl flex flex-col gap-6 sm:gap-8 pb-6 sm:pb-8 max-w-[746px]">
                {/* Search Input */}
                <button
                  type="button"
                  onClick={() => setLocationSubStep(1)}
                  className="w-full flex items-center gap-4 px-6 py-5 border-2 border-[#2F3A45] rounded-2xl hover:bg-gray-50 transition-colors text-left"
                >
                  <MapPin className="w-8 h-8 text-[#FCC519] flex-shrink-0" />
                  <span className="text-base text-black">Enter your address</span>
                </button>

                {/* Use Current Location */}
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setListing({
                            ...listing,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                          });
                          setLocationSubStep(1);
                        },
                        () => {
                          setLocationSubStep(1);
                        }
                      );
                    } else {
                      setLocationSubStep(1);
                    }
                  }}
                  className="flex items-center gap-4 px-5 hover:opacity-70 transition-opacity"
                >
                  <div className="w-[50px] h-[50px] bg-[#F0F2F5] rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <Navigation className="w-6 h-6 text-[#1D242B]" />
                  </div>
                  <span className="text-base text-black">Use current location</span>
                </button>

                {/* Enter Address Manually */}
                <button
                  type="button"
                  onClick={() => setLocationSubStep(1)}
                  className="flex items-center gap-4 px-5 hover:opacity-70 transition-opacity"
                >
                  <div className="w-[50px] h-[50px] bg-[#F0F2F5] rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <PenLine className="w-6 h-6 text-[#1D242B]" />
                  </div>
                  <span className="text-base text-black">Enter address manually</span>
                </button>
              </div>
            </div>
          );
        }
        return (
          <LocationStep
            {...stepProps}
            isMapLoaded={isMapLoaded}
          />
        );
      case 2:
        return <BasicsStep listing={listing} updateCounter={updateCounter} onBatchUpdate={(updates) => setListing(prev => ({ ...prev, ...updates }))} />;
      case 3:
        return <AmenitiesStep {...stepProps} />;
      case 4:
        return <HouseRulesStep {...stepProps} />;
      case 5:
        return <PhotosStep {...stepProps} />;
      case 6:
        return <TitleStep {...stepProps} />;
      case 7:
        return <PricingStep {...stepProps} currency={currency} />;
      case 8:
        return <DiscountsStep {...stepProps} />;
      case 9:
        return (
          <CancellationPolicyStep {...stepProps} />
        );
      case 10:
        return <LegalStep {...stepProps} countryName={countries.find((c: any) => String(c.id) === String(listing.country))?.name || ''} validationErrors={validationErrors} />;
      case 11:
        return <DocumentsStep {...stepProps} />;
      case 12:
        return <ReviewStep listing={{ ...listing, countryName: listing.countryName || countries.find((c: { id: number | string; name: string }) => String(c.id) === String(listing.country))?.name || '', cityName: listing.cityName || cities.find((c: { id: number | string; name: string }) => String(c.id) === String(listing.city))?.name || '' }} currency={currency} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FDFDFD] border-b border-[#F0F2F5]">
        <div className="px-3 sm:px-6 lg:px-[7.5%]">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/full_logo.png"
                alt="Logo"
                width={152}
                height={72}
              />
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  router.push('/');
                }}
                className="px-5 py-3 text-xs font-normal text-[#1D242B] border border-[#F0F2F5] rounded-full hover:bg-gray-50 transition-colors"
              >
                Save & Exit
              </button>
              <UserButton
                showName={false}
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9',
                    userButtonPopoverActionButton__manageAccount: 'hidden',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* User Selection Screen */}
      {showIntro && !selectedUser ? (
        <main className="flex-1 pt-24 lg:pt-28 pb-24 flex items-start justify-center">
          <div className="w-full max-w-[680px] px-4 mx-auto" ref={userSearchRef}>
            <div className="bg-white rounded-3xl border border-[#E8EAED] shadow-sm p-8 lg:p-10">
              {!showAddUserForm ? (
                <>
                  <div className="flex flex-col items-center gap-2 mb-8">
                    <div className="w-16 h-16 bg-[#FCC519]/10 rounded-2xl flex items-center justify-center mb-2">
                      <User className="w-8 h-8 text-[#FCC519]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1D242B] text-center">
                      Who is this listing for?
                    </h2>
                    <p className="text-sm text-[#647C94] text-center">
                      Search and select the property owner to create a listing on their behalf.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="flex items-center px-4 py-4 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-2xl focus-within:border-[#FCC519] focus-within:bg-white transition-all">
                      <Search className="w-5 h-5 text-[#9CA3AF] flex-shrink-0 mr-3" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        autoFocus
                        className="flex-1 text-base text-[#1D242B] placeholder:text-[#B0B8C1] outline-none bg-transparent"
                      />
                      {isSearchingUsers && (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#FCC519] border-t-transparent ml-2" />
                      )}
                    </div>

                    {showUserDropdown && userSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-[#E5E9EE] rounded-2xl shadow-xl max-h-[280px] overflow-y-auto">
                        {userSearchResults.map((user: { id: string | number; name?: string; firstName?: string; lastName?: string; email?: string }) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser({
                                id: String(user.id),
                                name: user.name || (user.firstName || user.lastName)
                                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                  : user.email || 'Unknown',
                                email: user.email || '',
                              });
                              setShowUserDropdown(false);
                              setUserSearchQuery('');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F8F9FA] transition-colors text-left first:rounded-t-2xl last:rounded-b-2xl"
                          >
                            <div className="w-10 h-10 bg-[#F0F2F5] rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-[#5E5E5E]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#1D242B] truncate">
                                {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'}
                              </p>
                              <p className="text-xs text-[#9CA3AF] truncate">{user.email || ''}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {showUserDropdown && userSearchResults.length === 0 && !isSearchingUsers && userSearchQuery.length >= 2 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-[#E5E9EE] rounded-2xl shadow-xl px-4 py-8 text-center">
                        <User className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                        <p className="text-sm text-[#9CA3AF]">No users found</p>
                      </div>
                    )}
                  </div>

                  {userSearchQuery.length === 0 && (
                    <p className="text-xs text-[#B0B8C1] text-center mt-4">
                      Start typing at least 2 characters to search
                    </p>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-[#E5E9EE]" />
                    <span className="text-xs text-[#9CA3AF] uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-[#E5E9EE]" />
                  </div>

                  {/* Add new user button */}
                  <button
                    type="button"
                    onClick={() => {
                      resetAddUserForm();
                      setShowAddUserForm(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-dashed border-[#E5E9EE] rounded-2xl text-sm font-semibold text-[#1D242B] hover:border-[#FCC519] hover:bg-[#FCC519]/5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserPlus className="w-5 h-5 text-[#FCC519]" />
                    Add new user
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-8">
                    <button
                      type="button"
                      title="Back to search"
                      onClick={() => {
                        setShowAddUserForm(false);
                        resetAddUserForm();
                      }}
                      disabled={isCreatingUser}
                      className="w-9 h-9 rounded-full bg-[#F8F9FA] hover:bg-[#F0F2F5] flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      <ArrowLeft className="w-5 h-5 text-[#1D242B]" />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-[#1D242B]">Add new user</h2>
                      <p className="text-xs text-[#647C94]">Create a property owner account</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1D242B]">First name<span className="text-red-500 ml-1">*</span></label>
                        <input
                          type="text"
                          value={newUserForm.firstName}
                          disabled={isCreatingUser}
                          onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                          placeholder="John"
                          className={`px-4 py-3 bg-[#F8F9FA] border-2 rounded-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519] focus:bg-white transition-colors ${
                            newUserErrors.firstName ? 'border-red-400' : 'border-[#E5E9EE]'
                          }`}
                        />
                        {newUserErrors.firstName && (
                          <p className="text-xs text-red-500">{newUserErrors.firstName}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1D242B]">Last name<span className="text-red-500 ml-1">*</span></label>
                        <input
                          type="text"
                          value={newUserForm.lastName}
                          disabled={isCreatingUser}
                          onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                          placeholder="Doe"
                          className={`px-4 py-3 bg-[#F8F9FA] border-2 rounded-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519] focus:bg-white transition-colors ${
                            newUserErrors.lastName ? 'border-red-400' : 'border-[#E5E9EE]'
                          }`}
                        />
                        {newUserErrors.lastName && (
                          <p className="text-xs text-red-500">{newUserErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D242B]">Email<span className="text-red-500 ml-1">*</span></label>
                      <input
                        type="email"
                        value={newUserForm.email}
                        disabled={isCreatingUser}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        placeholder="user@example.com"
                        className={`px-4 py-3 bg-[#F8F9FA] border-2 rounded-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519] focus:bg-white transition-colors ${
                          newUserErrors.email ? 'border-red-400' : 'border-[#E5E9EE]'
                        }`}
                      />
                      {newUserErrors.email && (
                        <p className="text-xs text-red-500">{newUserErrors.email}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D242B]">Phone<span className="text-red-500 ml-1">*</span></label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={newUserForm.phone}
                        disabled={isCreatingUser}
                        onKeyDown={blockArabicNumeralKey}
                        onChange={(e) => {
                          const cleaned = stripArabicNumerals(e.target.value).replace(/[^0-9+]/g, '');
                          setNewUserForm({ ...newUserForm, phone: cleaned });
                        }}
                        placeholder="+201234567890"
                        className={`px-4 py-3 bg-[#F8F9FA] border-2 rounded-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519] focus:bg-white transition-colors ${
                          newUserErrors.phone ? 'border-red-400' : 'border-[#E5E9EE]'
                        }`}
                      />
                      {newUserErrors.phone && (
                        <p className="text-xs text-red-500">{newUserErrors.phone}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddUserForm(false);
                          resetAddUserForm();
                        }}
                        disabled={isCreatingUser}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#1D242B] bg-[#F0F2F5] hover:bg-[#E5E9EE] transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateUser}
                        disabled={isCreatingUser}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#1D242B] bg-[#FCC519] hover:bg-[#f0bb0e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCreatingUser ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating...
                          </>
                        ) : (
                          'Create user'
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

      ) : showIntro ? (
        <main className="flex-1 pt-24 lg:pt-28 pb-24 lg:pb-4 overflow-y-auto flex items-start justify-center">
          <div className="flex flex-col items-center gap-6 lg:gap-10 px-3 md:px-6 max-w-[1218px] w-full lg:my-auto">
            {/* Selected user banner */}
            <div className="w-full max-w-[600px] flex items-center justify-between px-5 py-3 mt-8 bg-[#F8F9FA] border border-[#E5E9EE] rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FCC519] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#1D242B]" />
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF]">Creating listing for</p>
                  <p className="text-sm font-semibold text-[#1D242B]">{selectedUser?.name} <span className="font-normal text-[#9CA3AF]">· {selectedUser?.email}</span></p>
                </div>
              </div>
              <button
                type="button"
                title="Change user"
                onClick={() => {
                  setSelectedUser(null);
                  setUserSearchQuery('');
                }}
                className="text-xs font-semibold text-[#FCC519] hover:text-[#e0ad00] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#FCC519]/10"
              >
                Change
              </button>
            </div>

            <h1 className="text-2xl md:text-[34px] font-bold text-[#1D242B] text-center leading-[1.4] md:leading-[1.5]">
              List your property in just a few simple steps
            </h1>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full justify-center">
              {[
                {
                  num: '1',
                  img: '/images/listing/step1-illustration.svg',
                  title: 'Property Basics',
                  desc: 'Tell us about your property type, location, and room details.',
                },
                {
                  num: '2',
                  img: '/images/listing/step2-illustration.svg',
                  title: 'Property Details',
                  desc: 'Add amenities, house rules, and upload photos of your property.',
                },
                {
                  num: '3',
                  img: '/images/listing/step3-illustration.svg',
                  title: 'Finalize',
                  desc: 'Set your pricing, policies, and review your listing before publishing.',
                },
              ].map((card) => (
                <div
                  key={card.num}
                  className="flex-1 max-w-[390px] mx-auto w-full bg-[rgba(240,242,245,0.4)] rounded-2xl px-5 lg:px-[30px] pt-5 lg:pt-[30px] pb-6 lg:pb-[50px] flex flex-col items-center gap-3 lg:gap-5"
                >
                  <div className="bg-[#2F3A45] text-[#FCC519] rounded-2xl px-4 py-2 lg:px-5 lg:py-2.5 text-lg lg:text-xl font-medium">
                    {card.num}
                  </div>
                  <div className="w-full h-[140px] lg:h-[200px] relative">
                    <Image
                      src={card.img}
                      alt={card.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-lg lg:text-2xl font-bold text-[#2F3A45] text-center">
                    {card.title}
                  </h3>
                  <p className="text-sm lg:text-base text-[#647C94] text-center">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowIntro(false)}
              className="w-full max-w-[340px] py-3.5 bg-[#FCC519] text-[#1D242B] text-base font-semibold rounded-xl hover:bg-[#f0bb0e] transition-colors mb-4"
            >
              Get Started
            </button>
          </div>
        </main>
      ) : (
        <>
          {/* Step Layout */}
          <main className="flex-1 pt-24 lg:pt-28 pb-24">
            <div className="px-3 sm:px-6 lg:px-[7.5%] flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* LEFT: Info Card (desktop only) */}
              <div className="hidden lg:block w-[392px] flex-shrink-0 sticky top-24 h-fit">
                <div className="w-full bg-[rgba(240,242,245,0.4)] rounded-2xl flex flex-col items-center gap-5 px-[30px] pt-[30px] pb-[50px]">
                  <div className="w-full h-[250px] relative">
                    <Image
                      src={currentPhaseInfo.illustration}
                      alt={currentPhaseInfo.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-[#2F3A45] text-center">
                    {currentPhaseInfo.title}
                  </h2>
                  <p className="text-base text-[#647C94] text-center">
                    {currentPhaseInfo.subtitle}
                  </p>
                </div>
              </div>

              {/* RIGHT: Content Area */}
              <div className="flex-1 min-w-0">
                {/* Header row: step title + step counter */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-1 sm:gap-4">
                  <h1 className="text-xl lg:text-2xl font-bold text-[#1D242B]">
                    {steps[currentStep].title}
                  </h1>
                  <span className="text-sm font-medium text-[#5E5E5E] whitespace-nowrap">
                    {`Step ${currentStep + 1} of ${steps.length}`}
                  </span>
                </div>

                {/* Progress bar - one segment per step */}
                <div className="flex gap-[15px] mb-8">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                        i <= currentStep ? 'bg-[#FCC519]' : 'bg-[#F0F2F5]'
                      }`}
                    />
                  ))}
                </div>

                {/* Step Content */}
                {renderStep()}
              </div>
            </div>
          </main>

          {/* Footer Navigation */}
          <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#F0F2F5]">
            <div className="px-3 sm:px-6 lg:px-[7.5%] py-4">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={handleBack}
                  disabled={currentStep <= minStep || isSubmitting || isSavingDraft}
                  className={`flex-1 lg:flex-none lg:w-[250px] py-3.5 rounded-lg text-base font-semibold text-center transition-colors ${
                    currentStep <= minStep || isSubmitting || isSavingDraft
                      ? 'bg-[#E5E9EE] text-[#B1BDCA] cursor-not-allowed'
                      : 'bg-[#F0F2F5] text-[#1D242B] hover:bg-gray-200'
                  }`}
                >
                  Back
                </button>

                <button
                  onClick={
                    currentStep === steps.length - 1
                      ? handleSubmit
                      : handleNext
                  }
                  disabled={isSubmitting || isSavingDraft || (currentStep === 1 && locationSubStep === 0)}
                  className={`flex-1 lg:flex-none lg:w-[250px] py-3.5 rounded-xl text-base font-semibold text-center transition-colors flex items-center justify-center gap-2 ${
                    isSubmitting || isSavingDraft || (currentStep === 1 && locationSubStep === 0)
                      ? 'bg-[#F0F2F5] text-[#B1BDCA] cursor-not-allowed'
                      : 'bg-[#FCC519] text-[#1D242B] hover:bg-[#f0bb0e]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating...
                    </>
                  ) : isSavingDraft ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : currentStep === steps.length - 1 ? (
                    propertyId ? 'Edit List' : 'Create Listing'
                  ) : (
                    'Next'
                  )}
                </button>
              </div>
            </div>
          </footer>
        </>
      )}

    </div>
  );
}
