'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PropertyAPI, UsersAPI } from '@/lib/api/backend-api';
import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import Swal from 'sweetalert2';
import { MapPin, Navigation, PenLine, Search, User, UserPlus, X, ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react';
import { stripArabicNumerals, blockArabicNumeralKey } from '@/lib/utils/numeric-input';
import { countries as dialCountries } from '@/lib/countries';
import { PropertyFormData } from '@/app/types';
import { useTranslation } from '@/lib/i18n/context';
import { LocaleSwitcher } from '@/app/components/LocaleSwitcher';
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
  const { t } = useTranslation();

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
  const [isInvitingUser, setIsInvitingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    createByPhone: null as boolean | null,
  });
  const [newUserDialCode, setNewUserDialCode] = useState<string>('+20');
  const [newUserErrors, setNewUserErrors] = useState<Record<string, string>>({});
  const [showDialDropdown, setShowDialDropdown] = useState(false);
  const [dialSearchQuery, setDialSearchQuery] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const dialDropdownRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (dialDropdownRef.current && !dialDropdownRef.current.contains(e.target as Node)) {
        setShowDialDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDialCountries = (() => {
    const q = dialSearchQuery.trim().toLowerCase();
    if (!q) return dialCountries;
    return dialCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  })();

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
    setNewUserForm({ firstName: '', lastName: '', email: '', password: '', phone: '', createByPhone: null });
    setNewUserDialCode('+20');
    setNewUserErrors({});
    setShowNewUserPassword(false);
  };

  const handleCreateUser = async () => {
    const errors: Record<string, string> = {};
    const firstName = newUserForm.firstName.trim();
    const lastName = newUserForm.lastName.trim();
    const email = newUserForm.email.trim();
    const password = newUserForm.password;
    const phone = newUserForm.phone.trim();

    if (!firstName) errors.firstName = t('addListing.validation.firstNameRequired');
    if (!lastName) errors.lastName = t('addListing.validation.lastNameRequired');
    if (!email) {
      errors.email = t('addListing.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('addListing.validation.validEmail');
    }
    if (!password) {
      errors.password = t('addListing.validation.passwordRequired');
    } else if (password.length < 8) {
      errors.password = t('addListing.validation.passwordMinLength');
    }
    if (!phone) {
      errors.phone = t('addListing.validation.phoneRequired');
    } else if (phone.length < 6) {
      errors.phone = t('addListing.validation.phoneTooShort');
    }
    if (newUserForm.createByPhone === null) {
      errors.createByPhone = t('addListing.validation.selectOwnedByHouseiana');
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
          title: t('addListing.alerts.authRequired'),
          text: t('addListing.alerts.authRequiredCreate'),
          confirmButtonColor: '#000',
        });
        return;
      }

      const res = await UsersAPI.upsertClerk(
        { email, firstName, lastName, password, countryCode: newUserDialCode, phone, CreateByPhone: newUserForm.createByPhone === true },
        token
      );

      if (res.success && res.data) {
        const raw = res.data as Record<string, unknown>;
        const user = (raw.data as Record<string, unknown> | undefined) || raw;
        const id = user?.id ?? user?.userId ?? user?.clerkId;
        if (!id) {
          await Swal.fire({
            icon: 'error',
            title: t('addListing.alerts.couldNotCreateUser'),
            text: t('addListing.alerts.noValidUser'),
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
          title: t('addListing.alerts.userCreated'),
          text: t('addListing.alerts.userAdded', { name: fullName }),
          confirmButtonColor: '#10B981',
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        const errData = res.data as { message?: string } | undefined;
        const message = errData?.message || res.error || t('addListing.alerts.failedToCreateUser');
        await Swal.fire({
          icon: 'error',
          title: t('addListing.alerts.couldNotCreateUser'),
          text: message,
          confirmButtonColor: '#000',
        });
      }
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: t('addListing.alerts.couldNotCreateUser'),
        text: e instanceof Error ? e.message : t('addListing.alerts.somethingWentWrong'),
        confirmButtonColor: '#000',
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleInviteUser = async () => {
    const { value: email, isConfirmed } = await Swal.fire<string>({
      title: t('addListing.alerts.inviteUserTitle'),
      text: t('addListing.alerts.inviteUserText'),
      input: 'email',
      inputPlaceholder: 'user@example.com',
      showCancelButton: true,
      confirmButtonText: t('addListing.alerts.sendInvitation'),
      confirmButtonColor: '#FCC519',
      cancelButtonColor: '#9CA3AF',
      inputValidator: (value) => {
        const v = (value || '').trim();
        if (!v) return t('addListing.alerts.emailRequired');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return t('addListing.alerts.validEmailRequired');
        return null;
      },
    });

    if (!isConfirmed || !email) return;

    setIsInvitingUser(true);
    try {
      const token = await getToken();
      if (!token) {
        await Swal.fire({
          icon: 'error',
          title: t('addListing.alerts.authRequired'),
          text: t('addListing.alerts.authRequiredInvite'),
          confirmButtonColor: '#000',
        });
        return;
      }

      const res = await UsersAPI.sendInvitation(email.trim(), token);

      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: t('addListing.alerts.invitationSent'),
          text: t('addListing.alerts.invitationSentText', { email: email.trim() }),
          confirmButtonColor: '#10B981',
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        const errData = res.data as { message?: string } | undefined;
        const message = errData?.message || res.error || t('addListing.alerts.failedToSendInvitation');
        await Swal.fire({
          icon: 'error',
          title: t('addListing.alerts.couldNotSendInvitation'),
          text: message,
          confirmButtonColor: '#000',
        });
      }
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: t('addListing.alerts.couldNotSendInvitation'),
        text: e instanceof Error ? e.message : t('addListing.alerts.somethingWentWrong'),
        confirmButtonColor: '#000',
      });
    } finally {
      setIsInvitingUser(false);
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
    instantBook: null,
    minimumDaysForBooking: 1,
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
    phoneCountryCode: '',
    emergencyPhoneNumber: '',
    emergencyPhoneCountryCode: '',
    isPropertyOwner: true,
    managedBy: false,
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
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const response = await PropertyAPI.getById(propertyId, token);
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
            instantBook: property.instantBook ?? property.instant_book ?? null,
            minimumDaysForBooking:
              property.minimumDaysForBooking ??
              property.minimum_days_for_booking ??
              property.bookingSettings?.minimumDaysForBooking ??
              1,
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
            managedBy: property.managedBy ?? property.managed_by ?? false,

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
            title: t('addListing.alerts.error'),
            text: t('addListing.alerts.failedToLoadProperty'),
          });
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        Swal.fire({
          icon: 'error',
          title: t('addListing.alerts.error'),
          text: t('addListing.alerts.failedToLoadProperty'),
        });
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchPropertyData();
    }
  }, [propertyId, getToken]);

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
    { id: 0, phase: 1, title: t('addListing.steps.propertyType.title'), subtitle: t('addListing.steps.propertyType.subtitle') },
    { id: 1, phase: 1, title: t('addListing.steps.location.title'), subtitle: t('addListing.steps.location.subtitle') },
    { id: 2, phase: 1, title: t('addListing.steps.roomDetails.title'), subtitle: t('addListing.steps.roomDetails.subtitle') },
    { id: 3, phase: 2, title: t('addListing.steps.amenities.title'), subtitle: t('addListing.steps.amenities.subtitle') },
    { id: 4, phase: 2, title: t('addListing.steps.houseRules.title'), subtitle: t('addListing.steps.houseRules.subtitle') },
    { id: 5, phase: 2, title: t('addListing.steps.photos.title'), subtitle: t('addListing.steps.photos.subtitle') },
    { id: 6, phase: 3, title: t('addListing.steps.titleDescription.title'), subtitle: t('addListing.steps.titleDescription.subtitle') },
    { id: 7, phase: 3, title: t('addListing.steps.classificationPricing.title'), subtitle: t('addListing.steps.classificationPricing.subtitle') },
    { id: 8, phase: 3, title: t('addListing.steps.discounts.title'), subtitle: t('addListing.steps.discounts.subtitle') },
    { id: 9, phase: 3, title: t('addListing.steps.cancellationPolicy.title'), subtitle: t('addListing.steps.cancellationPolicy.subtitle') },
    { id: 10, phase: 3, title: t('addListing.steps.legalBooking.title'), subtitle: t('addListing.steps.legalBooking.subtitle') },
    { id: 11, phase: 3, title: t('addListing.steps.documents.title'), subtitle: t('addListing.steps.documents.subtitle') },
    { id: 12, phase: 3, title: t('addListing.steps.review.title'), subtitle: t('addListing.steps.review.subtitle') },
  ];

  const phases = [
    { id: 1, title: t('addListing.phases.propertyBasics'), steps: [0, 1, 2] },
    { id: 2, title: t('addListing.phases.propertyDetails'), steps: [3, 4, 5] },
    { id: 3, title: t('addListing.phases.finalize'), steps: [6, 7, 8, 9, 10, 11, 12] },
  ];

  // Enhanced validation function with detailed error tracking
  const validateStep = async (step: number, showAlert: boolean = true): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
    const errors: Record<string, string> = {};
    let missingFields: string[] = [];

    switch (step) {
      case 0: // Property Type
        if (!listing.propertyType) {
          errors.propertyType = t('addListing.validation.propertyTypeRequired');
          missingFields.push(t('addListing.validation.fields.propertyType'));
        }
        break;

      case 1: // Location
        if (!listing.country) {
          errors.country = t('addListing.validation.countryRequired');
          missingFields.push(t('addListing.validation.fields.country'));
        }
        if (!listing.city) {
          errors.city = t('addListing.validation.cityRequired');
          missingFields.push(t('addListing.validation.fields.city'));
        }
        if (!listing.street) {
          errors.street = t('addListing.validation.streetRequired');
          missingFields.push(t('addListing.validation.fields.street'));
        }
        {
          const countryName = countries.find((c) => String(c.id) === String(listing.country))?.name || '';
          if (countryName.toLowerCase().includes('egypt') && !listing.postalCode) {
            errors.postalCode = t('addListing.validation.postalCodeRequiredEgypt');
            missingFields.push(t('addListing.validation.fields.postalCode'));
          }
        }
        break;

      case 2: // Basics - Enhanced validation
        if (listing.guests < 1) {
          errors.guests = t('addListing.validation.guestsMin');
        }
        if (listing.bedrooms < 1) {
          errors.bedrooms = t('addListing.validation.bedroomsMin');
          missingFields.push(t('addListing.validation.fields.bedrooms'));
        }
        if (listing.beds < 1) {
          errors.beds = t('addListing.validation.bedsMin');
          missingFields.push(t('addListing.validation.fields.beds'));
        }
        if (listing.bathrooms < 1) {
          errors.bathrooms = t('addListing.validation.bathroomsMin');
          missingFields.push(t('addListing.validation.fields.bathrooms'));
        }
        break;

      case 3: // Amenities (optional step, no validation required)
        break;

      case 4: // House Rules
        if (!listing.checkInTime) {
          errors.checkInTime = t('addListing.validation.checkInRequired');
          missingFields.push(t('addListing.validation.fields.checkIn'));
        }
        if (!listing.checkOutTime) {
          errors.checkOutTime = t('addListing.validation.checkOutRequired');
          missingFields.push(t('addListing.validation.fields.checkOut'));
        }
        break;

      case 5: // Photos
        if (listing.photos.length < 5) {
          errors.photos = `${listing.photos.length}/5`;
          missingFields.push(t('addListing.validation.fields.morePhotos', { count: 5 - listing.photos.length }));
        }
        break;

      case 6: // Title + Description
        if (!listing.title.trim()) {
          errors.title = t('addListing.validation.titleRequired');
          missingFields.push(t('addListing.validation.fields.title'));
        } else if (listing.title.trim().length < 10) {
          errors.title = t('addListing.validation.titleMinLength');
        }
        if (!listing.description.trim()) {
          errors.description = t('addListing.validation.descriptionRequired');
          missingFields.push(t('addListing.validation.fields.description'));
        } else if (listing.description.trim().length < 50) {
          errors.description = t('addListing.validation.descriptionMinLength');
        }
        break;

      case 7: // Classification + Pricing
        if (!listing.stars || listing.stars === 0) {
          errors.stars = t('addListing.validation.starsRequired');
          missingFields.push(t('addListing.validation.fields.stars'));
        }
        const isEGP = currency === 'EGP';
        const minBasePrice = isEGP ? 1000 : 20;
        const maxBasePrice = isEGP ? 100000 : 10000;
        const maxCleaningFee = isEGP ? 3000 : 35;
        const currencySymbol = isEGP ? 'EGP' : 'EGP';
        if (!listing.basePrice || listing.basePrice < minBasePrice) {
          errors.basePrice = t('addListing.pricing.minimumPrice', { currency: currencySymbol, amount: minBasePrice.toLocaleString() });
          missingFields.push(t('addListing.validation.fields.basePrice'));
        } else if (listing.basePrice > maxBasePrice) {
          errors.basePrice = t('addListing.pricing.maximumPrice', { currency: currencySymbol, amount: maxBasePrice.toLocaleString() });
        }
        if ((listing.cleaningFee || 0) > maxCleaningFee) {
          errors.cleaningFee = t('addListing.pricing.cleaningFeeCannotExceed', { currency: currencySymbol, amount: maxCleaningFee.toLocaleString() });
        } else if (isEGP && (listing.cleaningFee || 0) > (listing.basePrice || 0)) {
          errors.cleaningFee = t('addListing.validation.cleaningFeeOverPrice');
        }
        break;

      case 8: // Discounts (optional step)
        break;

      case 9: // Cancellation Policy
        if (!listing.cancellationPolicy?.policyType) {
          errors.cancellationPolicy = t('addListing.validation.cancellationPolicyRequired');
          missingFields.push(t('addListing.validation.fields.cancellationPolicy'));
        }
        break;

      case 10: { // Legal/Booking Settings
        const phoneDigits = listing.phoneNumber.replace(/\D/g, '');
        if (!phoneDigits) {
          errors.phoneNumber = t('addListing.validation.phoneRequired');
          missingFields.push(t('addListing.validation.fields.phoneNumber'));
        } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
          errors.phoneNumber = t('addListing.validation.phoneInvalidLength');
        }
        const emergencyDigits = listing.emergencyPhoneNumber.replace(/\D/g, '');
        if (emergencyDigits && (emergencyDigits.length < 7 || emergencyDigits.length > 15)) {
          errors.emergencyPhoneNumber = t('addListing.validation.emergencyPhoneInvalidLength');
        }
        if (listing.instantBook === null) {
          errors.instantBook = t('addListing.validation.instantBookRequired');
          missingFields.push(t('addListing.validation.fields.instantBook'));
        }
        break;
      }

      case 11: // Documents — Host ID & Property Document are optional
        if (!listing.isPropertyOwner && !listing.documentOfProperty.PowerOfAttorney) {
          errors.powerOfAttorney = t('addListing.validation.powerOfAttorneyRequired');
          missingFields.push(t('addListing.validation.fields.powerOfAttorney'));
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
        alertTitle = t('addListing.alerts.completeRequiredFields');
        alertText = missingFields.map(field => `• ${field}`).join('\n');
      } else {
        alertTitle = t('addListing.alerts.fixErrorsBelow');
        alertText = Object.values(errors).join('\n• ');
      }

      await Swal.fire({
        icon: 'warning',
        title: alertTitle,
        text: alertText,
        confirmButtonColor: '#10B981',
        confirmButtonText: t('addListing.alerts.gotIt'),
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
    if (!userId) return { ok: false, message: t('addListing.alerts.authRequiredApi') };
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
        if (listing.instantBook !== null) {
          formData.append(
            'bookingSettings.instantBook',
            String(listing.instantBook)
          );
        }
        formData.append(
          'bookingSettings.minimumDaysForBooking',
          String(listing.minimumDaysForBooking ?? 1)
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
        formData.append('managedBy', String(listing.managedBy));
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
      if (!clerkToken) return { ok: false, message: t('addListing.alerts.authRequiredApi') };

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
      const apiMessage = errData?.message || response.error || t('addListing.alerts.saveFailedText');
      return { ok: false, message: apiMessage };
    } catch (error) {
      console.error('Error saving draft:', error);
      return { ok: false, message: error instanceof Error ? error.message : t('addListing.alerts.saveFailedText') };
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
              title: t('addListing.alerts.saveFailed'),
              text: result.message || t('addListing.alerts.saveFailedText'),
              confirmButtonColor: '#000',
            });
            return;
          }
        } catch (e: any) {
          console.error('Draft save failed:', e);
          await Swal.fire({
            icon: 'error',
            title: t('addListing.alerts.saveFailed'),
            text: t('addListing.alerts.saveFailedText'),
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
        title: t('addListing.alerts.authRequired'),
        text: t('addListing.alerts.authRequiredListing'),
        confirmButtonColor: '#000',
      });
      router.push('/sign-in');
      return;
    }

    if (!listing.title || !listing.description) {
      await Swal.fire({
        icon: 'error',
        title: t('addListing.alerts.missingInformation'),
        text: t('addListing.alerts.missingInformationText'),
        confirmButtonColor: '#000',
      });
      setCurrentStep(5);
      return;
    }

    if (!listing.propertyType) {
      await Swal.fire({
        icon: 'error',
        title: t('addListing.alerts.missingPropertyType'),
        text: t('addListing.alerts.missingPropertyTypeText'),
        confirmButtonColor: '#000',
      });
      setCurrentStep(0);
      return;
    }

    if (!listing.city || !listing.country) {
      await Swal.fire({
        icon: 'error',
        title: t('addListing.alerts.incompleteLocation'),
        text: t('addListing.alerts.incompleteLocationText'),
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
            title: t('addListing.alerts.propertyUpdated'),
            text: t('addListing.alerts.propertyUpdatedText', { title: listing.title }),
            confirmButtonColor: '#000',
          });
          router.push('/');
        } else {
          throw new Error(result.message || t('addListing.alerts.failedToUpdateProperty'));
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
          title: t('addListing.alerts.propertyCreatedTitle', { title: listing.title }),
          text: t('addListing.alerts.propertyCreatedText'),
          confirmButtonColor: '#000',
        });
        router.push('/');
      } else {
        throw new Error(result.message || t('addListing.alerts.failedToAddProperty'));
      }
    } catch (error: any) {
      console.error('Error submitting property:', error);
      await Swal.fire({
        icon: 'error',
        title: t('addListing.alerts.submissionFailed'),
        text: t('addListing.alerts.submissionFailedText', { message: error.message }),
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
    { illustration: '/images/listing/step1-illustration.svg', title: t('addListing.phaseInfo.phase1.title'), subtitle: t('addListing.phaseInfo.phase1.subtitle') },
    { illustration: '/images/listing/step2-illustration.svg', title: t('addListing.phaseInfo.phase2.title'), subtitle: t('addListing.phaseInfo.phase2.subtitle') },
    { illustration: '/images/listing/step3-illustration.svg', title: t('addListing.phaseInfo.phase3.title'), subtitle: t('addListing.phaseInfo.phase3.subtitle') },
  ];

  // Step-specific overrides for the left card
  const stepInfoOverrides: Record<number, { illustration: string; title: string; subtitle: string }> = {
    1:  { illustration: '/images/listing/location-illustration.svg',              title: t('addListing.stepInfoOverrides.location.title'),     subtitle: t('addListing.stepInfoOverrides.location.subtitle') },
    4:  { illustration: '/images/listing/houserules-illustration.svg',            title: t('addListing.stepInfoOverrides.houseRules.title'),   subtitle: t('addListing.stepInfoOverrides.houseRules.subtitle') },
    6:  { illustration: '/images/listing/title-illustration-48a20e.png',          title: t('addListing.stepInfoOverrides.title.title'),        subtitle: t('addListing.stepInfoOverrides.title.subtitle') },
    7:  { illustration: '/images/listing/pricing-illustration-332fe1.png',        title: t('addListing.stepInfoOverrides.pricing.title'),      subtitle: t('addListing.stepInfoOverrides.pricing.subtitle') },
    8:  { illustration: '/images/listing/discounts-illustration-791af2.png',      title: t('addListing.stepInfoOverrides.discounts.title'),    subtitle: t('addListing.stepInfoOverrides.discounts.subtitle') },
    9:  { illustration: '/images/listing/cancellation-illustration-5e4bee.png',   title: t('addListing.stepInfoOverrides.cancellation.title'), subtitle: t('addListing.stepInfoOverrides.cancellation.subtitle') },
    10: { illustration: '/images/listing/legal-illustration.png',                 title: t('addListing.stepInfoOverrides.legal.title'),        subtitle: t('addListing.stepInfoOverrides.legal.subtitle') },
    11: { illustration: '/images/listing/documents-illustration.svg',             title: t('addListing.stepInfoOverrides.documents.title'),    subtitle: t('addListing.stepInfoOverrides.documents.subtitle') },
    12: { illustration: '/images/listing/review-illustration.svg',                title: t('addListing.stepInfoOverrides.review.title'),       subtitle: t('addListing.stepInfoOverrides.review.subtitle') },
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
                  <p className="text-gray-500">{t('addListing.locationChooser.loadingMap')}</p>
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
                  <span className="text-base text-black">{t('addListing.locationChooser.enterAddress')}</span>
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
                  <span className="text-base text-black">{t('addListing.locationChooser.useCurrentLocation')}</span>
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
                  <span className="text-base text-black">{t('addListing.locationChooser.enterAddressManually')}</span>
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
                alt={t('header.logoAlt')}
                width={152}
                height={72}
              />
            </Link>

            <div className="flex items-center gap-3">
              <LocaleSwitcher />
              <button
                onClick={() => {
                  router.push('/');
                }}
                className="px-5 py-3 text-xs font-normal text-[#1D242B] border border-[#F0F2F5] rounded-full hover:bg-gray-50 transition-colors"
              >
                {t('header.saveAndExit')}
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
                      {t('addListing.intro.title')}
                    </h2>
                    <p className="text-sm text-[#647C94] text-center">
                      {t('addListing.intro.subtitle')}
                    </p>
                  </div>

                  <div className="relative">
                    <div className="flex items-center px-4 py-4 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-2xl focus-within:border-[#FCC519] focus-within:bg-white transition-all">
                      <Search className="w-5 h-5 text-[#9CA3AF] flex-shrink-0 mr-3" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder={t('addListing.intro.searchPlaceholder')}
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
                        <p className="text-sm text-[#9CA3AF]">{t('addListing.intro.noResults')}</p>
                      </div>
                    )}
                  </div>

                  {userSearchQuery.length === 0 && (
                    <p className="text-xs text-[#B0B8C1] text-center mt-4">
                      {t('addListing.intro.minCharsHint')}
                    </p>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-[#E5E9EE]" />
                    <span className="text-xs text-[#9CA3AF] uppercase tracking-wider">{t('addListing.intro.or')}</span>
                    <div className="flex-1 h-px bg-[#E5E9EE]" />
                  </div>

                  {/* Add new user / Invite user buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        resetAddUserForm();
                        setShowAddUserForm(true);
                      }}
                      disabled={isInvitingUser}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-dashed border-[#E5E9EE] rounded-2xl text-sm font-semibold text-[#1D242B] hover:border-[#FCC519] hover:bg-[#FCC519]/5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UserPlus className="w-5 h-5 text-[#FCC519]" />
                      {t('addListing.intro.addNewUser')}
                    </button>
                    <button
                      type="button"
                      onClick={handleInviteUser}
                      disabled={isInvitingUser}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-dashed border-[#E5E9EE] rounded-2xl text-sm font-semibold text-[#1D242B] hover:border-[#FCC519] hover:bg-[#FCC519]/5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isInvitingUser ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {t('addListing.intro.sending')}
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5 text-[#FCC519]" />
                          {t('addListing.intro.inviteUser')}
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-8">
                    <button
                      type="button"
                      title={t('addListing.addUser.backToSearch')}
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
                      <h2 className="text-xl font-bold text-[#1D242B]">{t('addListing.addUser.title')}</h2>
                      <p className="text-xs text-[#647C94]">{t('addListing.addUser.subtitle')}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.addUser.firstName')}<span className="text-red-500 ml-1">*</span></label>
                        <input
                          type="text"
                          value={newUserForm.firstName}
                          disabled={isCreatingUser}
                          onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                          placeholder={t('addListing.addUser.firstNamePlaceholder')}
                          className={`px-4 py-3 bg-[#F8F9FA] border-2 rounded-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519] focus:bg-white transition-colors ${
                            newUserErrors.firstName ? 'border-red-400' : 'border-[#E5E9EE]'
                          }`}
                        />
                        {newUserErrors.firstName && (
                          <p className="text-xs text-red-500">{newUserErrors.firstName}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.addUser.lastName')}<span className="text-red-500 ml-1">*</span></label>
                        <input
                          type="text"
                          value={newUserForm.lastName}
                          disabled={isCreatingUser}
                          onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                          placeholder={t('addListing.addUser.lastNamePlaceholder')}
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
                      <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.addUser.email')}<span className="text-red-500 ml-1">*</span></label>
                      <input
                        type="email"
                        value={newUserForm.email}
                        disabled={isCreatingUser}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        placeholder={t('addListing.addUser.emailPlaceholder')}
                        className={`px-4 py-3 bg-[#F8F9FA] border-2 rounded-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519] focus:bg-white transition-colors ${
                          newUserErrors.email ? 'border-red-400' : 'border-[#E5E9EE]'
                        }`}
                      />
                      {newUserErrors.email && (
                        <p className="text-xs text-red-500">{newUserErrors.email}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.addUser.password')}<span className="text-red-500 ml-1">*</span></label>
                      <div className="relative">
                        <input
                          type={showNewUserPassword ? 'text' : 'password'}
                          value={newUserForm.password}
                          disabled={isCreatingUser}
                          onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                          placeholder={t('addListing.addUser.passwordPlaceholder')}
                          autoComplete="new-password"
                          className={`w-full px-4 py-3 pe-11 bg-[#F8F9FA] border-2 rounded-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519] focus:bg-white transition-colors ${
                            newUserErrors.password ? 'border-red-400' : 'border-[#E5E9EE]'
                          }`}
                        />
                        <button
                          type="button"
                          aria-label={showNewUserPassword ? t('addListing.addUser.hidePassword') : t('addListing.addUser.showPassword')}
                          onClick={() => setShowNewUserPassword((v) => !v)}
                          disabled={isCreatingUser}
                          className="absolute inset-y-0 inset-e-0 px-3 flex items-center text-[#5E5E5E] hover:text-[#1D242B] cursor-pointer disabled:cursor-not-allowed"
                        >
                          {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {newUserErrors.password && (
                        <p className="text-xs text-red-500">{newUserErrors.password}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.addUser.phone')}<span className="text-red-500 ml-1">*</span></label>
                      <div className="flex items-stretch">
                        <div ref={dialDropdownRef} className="relative">
                          <button
                            type="button"
                            aria-label={t('addListing.addUser.countryCode')}
                            disabled={isCreatingUser}
                            onClick={() => {
                              setShowDialDropdown((v) => !v);
                              setDialSearchQuery('');
                            }}
                            className={`h-full px-3 py-3 bg-[#F0F2F5] border-2 border-e-0 rounded-s-xl text-sm font-medium text-[#1D242B] outline-none focus:border-[#FCC519] cursor-pointer disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap ${
                              newUserErrors.phone ? 'border-red-400' : 'border-[#E5E9EE]'
                            }`}
                          >
                            <span>{dialCountries.find((c) => c.dialCode === newUserDialCode)?.code ?? ''}</span>
                            <span dir="ltr">{newUserDialCode}</span>
                            <svg className="w-3 h-3 text-[#5E5E5E]" viewBox="0 0 12 12" fill="none">
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          {showDialDropdown && (
                            <div className="absolute z-20 mt-1 inset-s-0 w-72 bg-white border-2 border-[#E5E9EE] rounded-xl shadow-lg overflow-hidden">
                              <div className="p-2 border-b border-[#E5E9EE]">
                                <div className="relative">
                                  <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B8C1]" />
                                  <input
                                    type="text"
                                    autoFocus
                                    value={dialSearchQuery}
                                    onChange={(e) => setDialSearchQuery(e.target.value)}
                                    placeholder={t('addListing.addUser.searchCountryPlaceholder')}
                                    className="w-full ps-9 pe-3 py-2 bg-[#F8F9FA] border border-[#E5E9EE] rounded-lg text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519]"
                                  />
                                </div>
                              </div>
                              <ul className="max-h-60 overflow-y-auto py-1">
                                {filteredDialCountries.length === 0 ? (
                                  <li className="px-3 py-2 text-sm text-[#5E5E5E]">{t('addListing.addUser.noMatches')}</li>
                                ) : (
                                  filteredDialCountries.map((c) => (
                                    <li key={c.code}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewUserDialCode(c.dialCode);
                                          setShowDialDropdown(false);
                                          setDialSearchQuery('');
                                        }}
                                        className={`w-full px-3 py-2 text-sm text-start flex items-center justify-between gap-3 hover:bg-[#F8F9FA] transition-colors ${
                                          c.dialCode === newUserDialCode ? 'bg-[#FCF9EE] text-[#1D242B] font-semibold' : 'text-[#1D242B]'
                                        }`}
                                      >
                                        <span className="truncate">{c.name}</span>
                                        <span className="text-[#5E5E5E] shrink-0" dir="ltr">{c.code} {c.dialCode}</span>
                                      </button>
                                    </li>
                                  ))
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                        <input
                          type="tel"
                          dir="ltr"
                          value={newUserForm.phone}
                          disabled={isCreatingUser}
                          onKeyDown={blockArabicNumeralKey}
                          onChange={(e) => {
                            const cleaned = stripArabicNumerals(e.target.value).replace(/[^0-9]/g, '');
                            setNewUserForm({ ...newUserForm, phone: cleaned });
                          }}
                          placeholder="1234567890"
                          className={`flex-1 px-4 py-3 bg-[#F8F9FA] border-2 rounded-e-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519] focus:bg-white transition-colors ${
                            newUserErrors.phone ? 'border-red-400' : 'border-[#E5E9EE]'
                          }`}
                        />
                      </div>
                      {newUserErrors.phone && (
                        <p className="text-xs text-red-500">{newUserErrors.phone}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className={`flex flex-col gap-3 px-4 py-3 bg-[#F8F9FA] border-2 rounded-xl ${
                        newUserErrors.createByPhone ? 'border-red-400' : 'border-[#E5E9EE]'
                      }`}>
                        <div className="flex flex-col gap-0.5">
                          <h3 className="text-sm font-semibold text-[#1D242B]">
                            {t('addListing.addUser.ownedByHouseiana')}
                            <span className="text-red-500 ml-1">*</span>
                          </h3>
                          <p className="text-xs text-[#5E5E5E]">
                            {t('addListing.addUser.ownedByHouseianaHint')}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            role="radio"
                            aria-checked={newUserForm.createByPhone === true}
                            onClick={() => {
                              if (isCreatingUser) return;
                              setNewUserForm({ ...newUserForm, createByPhone: true });
                              if (newUserErrors.createByPhone) {
                                setNewUserErrors({ ...newUserErrors, createByPhone: '' });
                              }
                            }}
                            disabled={isCreatingUser}
                            className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors ${
                              newUserForm.createByPhone === true
                                ? 'border-[#FCC519] bg-[#FCC519] text-[#1D242B]'
                                : 'border-[#E5E9EE] bg-white text-[#1D242B] hover:bg-[#F8F9FA]'
                            } ${isCreatingUser ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                          >
                            {t('addListing.addUser.yes')}
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={newUserForm.createByPhone === false}
                            onClick={() => {
                              if (isCreatingUser) return;
                              setNewUserForm({ ...newUserForm, createByPhone: false });
                              if (newUserErrors.createByPhone) {
                                setNewUserErrors({ ...newUserErrors, createByPhone: '' });
                              }
                            }}
                            disabled={isCreatingUser}
                            className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors ${
                              newUserForm.createByPhone === false
                                ? 'border-[#FCC519] bg-[#FCC519] text-[#1D242B]'
                                : 'border-[#E5E9EE] bg-white text-[#1D242B] hover:bg-[#F8F9FA]'
                            } ${isCreatingUser ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                          >
                            {t('addListing.addUser.no')}
                          </button>
                        </div>
                      </div>
                      {newUserErrors.createByPhone && (
                        <p className="text-xs text-red-500">{newUserErrors.createByPhone}</p>
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
                        {t('addListing.addUser.cancel')}
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
                            {t('addListing.addUser.creating')}
                          </>
                        ) : (
                          t('addListing.addUser.createUser')
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
                  <p className="text-xs text-[#9CA3AF]">{t('addListing.selectedUser.creatingFor')}</p>
                  <p className="text-sm font-semibold text-[#1D242B]">{selectedUser?.name} <span className="font-normal text-[#9CA3AF]">· {selectedUser?.email}</span></p>
                </div>
              </div>
              <button
                type="button"
                title={t('addListing.selectedUser.changeUser')}
                onClick={() => {
                  setSelectedUser(null);
                  setUserSearchQuery('');
                }}
                className="text-xs font-semibold text-[#FCC519] hover:text-[#e0ad00] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#FCC519]/10"
              >
                {t('addListing.selectedUser.change')}
              </button>
            </div>

            <h1 className="text-2xl md:text-[34px] font-bold text-[#1D242B] text-center leading-[1.4] md:leading-[1.5]">
              {t('addListing.getStarted.title')}
            </h1>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full justify-center">
              {[
                {
                  num: '1',
                  img: '/images/listing/step1-illustration.svg',
                  title: t('addListing.getStarted.card1Title'),
                  desc: t('addListing.getStarted.card1Desc'),
                },
                {
                  num: '2',
                  img: '/images/listing/step2-illustration.svg',
                  title: t('addListing.getStarted.card2Title'),
                  desc: t('addListing.getStarted.card2Desc'),
                },
                {
                  num: '3',
                  img: '/images/listing/step3-illustration.svg',
                  title: t('addListing.getStarted.card3Title'),
                  desc: t('addListing.getStarted.card3Desc'),
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
              {t('addListing.getStarted.button')}
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
                    {t('addListing.stepCounter', { current: currentStep + 1, total: steps.length })}
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
                  {t('addListing.footer.back')}
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
                      {t('addListing.footer.creating')}
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
                      {t('addListing.footer.saving')}
                    </>
                  ) : currentStep === steps.length - 1 ? (
                    propertyId ? t('addListing.footer.editList') : t('addListing.footer.createListing')
                  ) : (
                    t('addListing.footer.next')
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
