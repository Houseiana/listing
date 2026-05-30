'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Home as HomeIcon,
  Image as ImageIcon,
  Search,
} from 'lucide-react';
import { AdminsAPI, type AdminProperty } from '@/lib/api/backend-api';
import { useTranslation } from '@/lib/i18n/context';
import { Header } from '@/app/components/Header';

const PAGE_SIZE = 20;

type Pagination = { total: number; page: number; limit: number; totalPages: number };

const EMPTY_PAGINATION: Pagination = { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };

export default function PropertiesPage() {
  const router = useRouter();
  const { getToken, isLoaded: isAuthLoaded, isSignedIn, userId } = useAuth();
  const { t } = useTranslation();

  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [phoneInput, setPhoneInput] = useState('');
  const [phone, setPhone] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  // Debounce the phone filter and reset to the first page on change.
  useEffect(() => {
    const handle = setTimeout(() => {
      const cleaned = phoneInput.trim();
      setPhone(cleaned);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [phoneInput]);

  const fetchProperties = useCallback(async () => {
    if (!userId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        if (!controller.signal.aborted) setError('auth');
        return;
      }
      const res = await AdminsAPI.getProperties(userId, token, {
        page,
        limit: PAGE_SIZE,
        phone: phone || undefined,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      if (!res.success) {
        setError(res.error || 'fetch-failed');
        return;
      }

      const list = Array.isArray(res.data?.data) ? res.data!.data! : [];
      const p = res.data?.pagination;
      setProperties(list);
      setPagination({
        total: p?.total ?? list.length,
        page: p?.page ?? page,
        limit: p?.limit ?? PAGE_SIZE,
        totalPages: p?.totalPages ?? 1,
      });
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : 'fetch-failed');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [userId, getToken, page, phone]);

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    fetchProperties();
    return () => abortRef.current?.abort();
  }, [isAuthLoaded, isSignedIn, fetchProperties, router]);

  const totalPages = Math.max(1, pagination.totalPages);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 px-3 sm:px-6 lg:px-[7.5%] pt-20 lg:pt-28 pb-10">
        <div className="mx-auto">
          {/* Title + filter */}
          <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-[#1D242B]">{t('properties.title')}</h1>
              <p className="text-sm text-[#647C94]">{t('properties.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-2xl focus-within:border-[#FCC519] focus-within:bg-white transition-colors w-full sm:w-80">
                <Search className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                <input
                  type="tel"
                  inputMode="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder={t('properties.searchPlaceholder')}
                  className="flex-1 text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none bg-transparent"
                />
                {loading && phone && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#FCC519] border-t-transparent" />
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCC519]"></div>
              <p className="text-sm text-[#647C94]">{t('properties.loading')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl flex items-center justify-center">
                <HomeIcon className="w-8 h-8 text-[#9CA3AF]" />
              </div>
              <h2 className="text-xl font-bold text-[#1D242B]">{t('properties.errorTitle')}</h2>
              <p className="text-sm text-[#647C94]">{t('properties.errorSubtitle')}</p>
              <button
                type="button"
                onClick={fetchProperties}
                className="mt-3 px-5 py-2.5 rounded-full text-sm font-semibold text-[#1D242B] bg-[#FCC519] hover:bg-[#f0bb0e] transition-colors"
              >
                {t('properties.tryAgain')}
              </button>
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl flex items-center justify-center">
                <HomeIcon className="w-8 h-8 text-[#9CA3AF]" />
              </div>
              <p className="text-sm text-[#9CA3AF]">
                {phone ? t('properties.emptyPhone') : t('properties.empty')}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-[#647C94] uppercase tracking-wider mb-4">
                {t('properties.total', { count: pagination.total })}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {properties.map((p) => (
                  <PropertyCard key={p.propertyId} property={p} viewLabel={t('properties.view')} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => canPrev && setPage((n) => n - 1)}
                    disabled={!canPrev}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#1D242B] border border-[#E5E9EE] rounded-full hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                    {t('properties.previous')}
                  </button>
                  <span className="text-sm text-[#647C94] tabular-nums">
                    {t('properties.page', { page, total: totalPages })}
                  </span>
                  <button
                    type="button"
                    onClick={() => canNext && setPage((n) => n + 1)}
                    disabled={!canNext}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#1D242B] border border-[#E5E9EE] rounded-full hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('properties.next')}
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function PropertyCard({
  property,
  viewLabel,
}: {
  property: AdminProperty;
  viewLabel: string;
}) {
  const description = property.description?.trim();

  return (
    <div className="bg-white rounded-3xl border border-[#E8EAED] overflow-hidden hover:shadow-lg transition-all flex flex-col">
      <div className="relative h-[180px] bg-[#F0F2F5]">
        {property.coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={property.coverPhoto} alt={description || ''} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-[#C0C6D0]" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {description ? (
          <p className="text-sm text-[#1D242B] leading-relaxed line-clamp-3">{description}</p>
        ) : (
          <p className="text-sm text-[#9CA3AF] italic">—</p>
        )}

        <div className="mt-auto pt-1">
          {property.url ? (
            <a
              href={property.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 h-[38px] bg-[#1D242B] text-white rounded-full text-xs font-medium hover:bg-[#2F3A45] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {viewLabel}
            </a>
          ) : (
            <span className="w-full inline-flex items-center justify-center h-[38px] border border-[#E5E9EE] text-[#B0B8C1] rounded-full text-xs font-medium cursor-not-allowed">
              {viewLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
