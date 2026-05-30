'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  Bath,
  Bed,
  DoorOpen,
  Home as HomeIcon,
  Image as ImageIcon,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Ruler,
  User,
  Users,
} from 'lucide-react';
import { UserPropertiesAPI } from '@/lib/api/backend-api';
import { useTranslation } from '@/lib/i18n/context';
import { Header } from '@/app/components/Header';
import { YearCalendar } from './YearCalendar';
import { EditPropertyModal } from './EditPropertyModal';

type Property = Record<string, unknown>;

export default function PropertyDetailsPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCC519]"></div>
        </div>
      }
    >
      <PropertyDetailsPage />
    </Suspense>
  );
}

function pickString(obj: Property | undefined, ...keys: string[]): string | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

function pickNumber(obj: Property | undefined, ...keys: string[]): number | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return undefined;
}

function pickArray<T = unknown>(obj: Property | undefined, ...keys: string[]): T[] {
  if (!obj) return [];
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v as T[];
    if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed as T[];
      } catch {
        // not JSON, ignore
      }
    }
  }
  return [];
}

function pickObject(obj: Property | undefined, ...keys: string[]): Property | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as Property;
  }
  return undefined;
}

function PropertyDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { t } = useTranslation();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showEdit, setShowEdit] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!propertyId) {
      setError('missing-id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('auth');
        setLoading(false);
        return;
      }
      const res = await UserPropertiesAPI.getDetails(propertyId, token);
      if (res.success && res.data) {
        const raw = res.data as Record<string, unknown>;
        const data = (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data))
          ? (raw.data as Property)
          : (raw as Property);
        setProperty(data);
      } else {
        setError(res.error || 'fetch-failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch-failed');
    } finally {
      setLoading(false);
    }
  }, [propertyId, getToken]);

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    fetchDetails();
  }, [isAuthLoaded, isSignedIn, fetchDetails, router]);

  const photos: string[] = (() => {
    if (!property) return [];
    const raw = pickArray<unknown>(property, 'photos', 'images', 'propertyImages');
    return raw
      .map((p) => {
        if (typeof p === 'string') return p;
        if (p && typeof p === 'object') {
          const obj = p as Property;
          return (
            (typeof obj.url === 'string' && obj.url) ||
            (typeof obj.fileUrl === 'string' && obj.fileUrl) ||
            (typeof obj.path === 'string' && obj.path) ||
            ''
          );
        }
        return '';
      })
      .filter((s): s is string => Boolean(s));
  })();

  const cover = pickString(property ?? undefined, 'coverPhoto', 'cover', 'thumbnail') || photos[0];
  const title = pickString(property ?? undefined, 'title', 'name', 'propertyTitle') || `Property #${propertyId ?? ''}`;
  const description = pickString(property ?? undefined, 'description', 'about');
  const status = pickString(property ?? undefined, 'status', 'propertyStatus');
  const type = pickString(property ?? undefined, 'propertyTypeName', 'propertyType', 'type');
  const currency = pickString(property ?? undefined, 'currency') || 'EGP';
  const pricePerNight = pickNumber(property ?? undefined, 'basePrice', 'pricePerNight', 'price');
  const cleaningFee = pickNumber(property ?? undefined, 'cleaningFee');
  const electricalFee = pickNumber(property ?? undefined, 'electricalFee');
  const waterFee = pickNumber(property ?? undefined, 'waterFee');
  const guests = pickNumber(property ?? undefined, 'guests', 'maxGuests');
  const bedrooms = pickNumber(property ?? undefined, 'bedrooms');
  const beds = pickNumber(property ?? undefined, 'beds');
  const bathrooms = pickNumber(property ?? undefined, 'bathrooms');
  const areaSize = pickNumber(property ?? undefined, 'sizeOfProperty', 'areaSize', 'area_size', 'area');

  const address = pickObject(property ?? undefined, 'address');
  const country = pickString(property ?? undefined, 'countryName') || pickString(address, 'name', 'country');
  const city = pickString(property ?? undefined, 'cityName') || pickString(address, 'city');
  const street = pickString(address, 'streetAddress', 'street') || pickString(property ?? undefined, 'address', 'street');
  const locationLine = [street, city, country].filter(Boolean).join(', ');

  const owner = pickObject(property ?? undefined, 'owner', 'user', 'host');
  const ownerName = pickString(owner, 'fullName', 'name') ||
    [pickString(owner, 'firstName'), pickString(owner, 'lastName')].filter(Boolean).join(' ').trim() ||
    pickString(property ?? undefined, 'ownerName');
  const ownerEmail = pickString(owner, 'email') || pickString(property ?? undefined, 'ownerEmail', 'email');
  const ownerPhone = pickString(owner, 'phone', 'phoneNumber') || pickString(property ?? undefined, 'phone', 'phoneNumber');

  const amenities = pickArray<unknown>(property ?? undefined, 'amenities').map((a) => {
    if (typeof a === 'string') return a;
    if (a && typeof a === 'object') {
      const obj = a as Property;
      return pickString(obj, 'name', 'title', 'label') || '';
    }
    return '';
  }).filter(Boolean);

  const amenityIds = pickArray<unknown>(property ?? undefined, 'amenities').map((a) => {
    if (typeof a === 'number') return a;
    if (typeof a === 'string' && !Number.isNaN(Number(a))) return Number(a);
    if (a && typeof a === 'object') {
      const obj = a as Property;
      const id = pickNumber(obj, 'id', 'amenityId', 'itemId');
      return id ?? null;
    }
    return null;
  }).filter((x): x is number => x !== null && Number.isFinite(x));

  const minimumDaysForBooking = pickNumber(
    property ?? undefined,
    'minimumDaysForBooking',
    'minimum_days_for_booking',
  ) ?? pickNumber(pickObject(property ?? undefined, 'bookingSettings'), 'minimumDaysForBooking', 'minimum_days_for_booking');

  const cancellationPolicyObj = pickObject(property ?? undefined, 'propertyCancellationPolicy', 'cancellationPolicy');
  const cancellationPolicy = cancellationPolicyObj
    ? {
        policyType: pickString(cancellationPolicyObj, 'policyType', 'policy_type'),
        freeCancellationHours: pickNumber(cancellationPolicyObj, 'freeCancellationHours', 'free_cancellation_hours') ?? null,
        freeCancellationDays: pickNumber(cancellationPolicyObj, 'freeCancellationDays', 'free_cancellation_days') ?? null,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 px-3 sm:px-6 lg:px-[7.5%] pt-20 lg:pt-28 pb-10">
        <div className="mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCC519]"></div>
              <p className="text-sm text-[#647C94]">{t('addListing.propertyDetails.loading')}</p>
            </div>
          ) : error || !property ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl flex items-center justify-center">
                <HomeIcon className="w-8 h-8 text-[#9CA3AF]" />
              </div>
              <h2 className="text-xl font-bold text-[#1D242B]">{t('addListing.propertyDetails.notFound')}</h2>
              <p className="text-sm text-[#647C94]">{t('addListing.propertyDetails.notFoundSubtitle')}</p>
              <button
                type="button"
                onClick={fetchDetails}
                className="mt-3 px-5 py-2.5 rounded-full text-sm font-semibold text-[#1D242B] bg-[#FCC519] hover:bg-[#f0bb0e] transition-colors"
              >
                {t('addListing.propertyDetails.tryAgain')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-[#1D242B]">{title}</h1>
                  {locationLine ? (
                    <p className="text-sm text-[#647C94] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#9CA3AF]" />
                      {locationLine}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {status ? (
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FCF9EE] text-[#B38600] uppercase tracking-wider">
                      {status}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowEdit(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-[#1D242B] bg-[#FCC519] hover:bg-[#f0bb0e] transition-colors cursor-pointer shadow-sm"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {t('addListing.propertyDetails.editProperty')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-3 relative bg-[#F0F2F5] rounded-2xl overflow-hidden aspect-[16/10]">
                  {photos[activePhoto] || cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photos[activePhoto] || cover || ''}
                      alt={title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-12 h-12 text-[#C0C6D0]" />
                      <p className="text-xs text-[#9CA3AF]">{t('addListing.propertyDetails.noPhotos')}</p>
                    </div>
                  )}
                </div>
                {photos.length > 1 && (
                  <div className="lg:col-span-1 grid grid-cols-4 lg:grid-cols-2 gap-2 max-h-[400px] lg:max-h-none overflow-y-auto">
                    {photos.slice(0, 8).map((src, idx) => (
                      <button
                        key={`${src}-${idx}`}
                        type="button"
                        onClick={() => setActivePhoto(idx)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                          activePhoto === idx ? 'border-[#FCC519]' : 'border-transparent hover:border-[#E5E9EE]'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`${title} ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatTile icon={<Users className="w-4 h-4 text-[#5E5E5E]" />} label={t('addListing.propertyDetails.guests')} value={guests ?? '—'} />
                <StatTile icon={<DoorOpen className="w-4 h-4 text-[#5E5E5E]" />} label={t('addListing.propertyDetails.bedrooms')} value={bedrooms ?? '—'} />
                <StatTile icon={<Bed className="w-4 h-4 text-[#5E5E5E]" />} label={t('addListing.propertyDetails.beds')} value={beds ?? '—'} />
                <StatTile icon={<Bath className="w-4 h-4 text-[#5E5E5E]" />} label={t('addListing.propertyDetails.bathrooms')} value={bathrooms ?? '—'} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <Section title={t('addListing.propertyDetails.overview')}>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                      {type ? <Meta label={t('addListing.propertyDetails.type')} value={type} /> : null}
                      {areaSize !== undefined ? (
                        <Meta label={t('addListing.propertyDetails.area')} value={`${areaSize} m²`} icon={<Ruler className="w-3.5 h-3.5" />} />
                      ) : null}
                    </div>
                    {description ? (
                      <p className="text-sm text-[#1D242B] leading-relaxed whitespace-pre-line">{description}</p>
                    ) : (
                      <p className="text-sm text-[#9CA3AF] italic">—</p>
                    )}
                  </Section>

                  {amenities.length > 0 && (
                    <Section title={t('addListing.propertyDetails.amenities')}>
                      <div className="flex flex-wrap gap-2">
                        {amenities.map((a, idx) => (
                          <span
                            key={`${a}-${idx}`}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F8F9FA] text-[#1D242B] border border-[#E5E9EE]"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>

                <div className="flex flex-col gap-6">
                  <Section title={t('addListing.propertyDetails.pricing')}>
                    {pricePerNight !== undefined ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-[#1D242B]">{currency} {pricePerNight.toLocaleString()}</span>
                        <span className="text-xs text-[#9CA3AF]">/ {t('addListing.propertyDetails.pricePerNight')}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-[#9CA3AF] italic">—</p>
                    )}
                  </Section>

                  {(ownerName || ownerEmail || ownerPhone) && (
                    <Section title={t('addListing.propertyDetails.owner')}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[#F0F2F5] rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-[#5E5E5E]" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          {ownerName ? <p className="text-sm font-semibold text-[#1D242B] truncate">{ownerName}</p> : null}
                          {ownerEmail ? (
                            <p className="text-xs text-[#647C94] flex items-center gap-1.5 truncate">
                              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                              {ownerEmail}
                            </p>
                          ) : null}
                          {ownerPhone ? (
                            <p className="text-xs text-[#647C94] flex items-center gap-1.5 truncate" dir="ltr">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                              {ownerPhone}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Section>
                  )}

                  {/* {propertyId ? (
                    <Link
                      href={`/add-listing?id=${encodeURIComponent(propertyId)}`}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-[#1D242B] bg-[#FCC519] hover:bg-[#f0bb0e] transition-colors"
                    >
                      {t('addListing.propertyDetails.openListing')}
                    </Link>
                  ) : null} */}
                </div>
              </div>

              {propertyId ? (
                <YearCalendar
                  propertyId={propertyId}
                  currency={currency}
                  propertyTitle={title}
                  basePrice={pricePerNight}
                />
              ) : null}
            </div>
          )}
        </div>
      </main>

      {showEdit && propertyId ? (
        <EditPropertyModal
          propertyId={propertyId}
          initial={{
            title,
            description,
            pricePerNight,
            cleaningFee,
            electricalFee,
            waterFee,
            coverPhoto: cover,
            photos,
            currency,
            minimumDaysForBooking,
            guests,
            bedrooms,
            beds,
            bathrooms,
            amenities: amenityIds,
            cancellationPolicy,
          }}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            fetchDetails();
          }}
        />
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E9EE] rounded-2xl p-5">
      <h3 className="text-sm font-bold text-[#1D242B] uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 bg-[#F8F9FA] border border-[#E5E9EE] rounded-2xl px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">{label}</span>
        <span className="text-sm font-bold text-[#1D242B]">{value}</span>
      </div>
    </div>
  );
}

function Meta({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">{label}</span>
      <span className="text-sm font-semibold text-[#1D242B] flex items-center gap-1.5">
        {icon}
        {value}
      </span>
    </div>
  );
}
