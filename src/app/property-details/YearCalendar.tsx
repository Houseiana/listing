'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarX, ChevronLeft, ChevronRight, DollarSign, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Swal from 'sweetalert2';
import { UserPropertiesAPI } from '@/lib/api/backend-api';
import { useTranslation } from '@/lib/i18n/context';
import { stripArabicNumerals, blockNonPositiveNumeralKey } from '@/lib/utils/numeric-input';

type DateRange = { from: string; to: string };

type UnavailableDates = {
  bookedDates: DateRange[];
  blockedDates: DateRange[];
  maintenanceDates: DateRange[];
  deepCleaningDates: DateRange[];
};

type SpecialPriceDay = { date: string; price: number };

type DayStatus = 'available' | 'booked' | 'blocked' | 'maintenance' | 'deepCleaning';

type BlockReason = { id: number; name: string };

const STATUS_STYLES: Record<DayStatus, string> = {
  available: 'bg-white text-[#1D242B] hover:bg-[#F8F9FA]',
  booked: 'bg-[#BBF7D0] text-[#065F46] hover:bg-[#A7F3D0]',
  blocked: 'bg-[#FECACA] text-[#991B1B] hover:bg-[#FCA5A5]',
  maintenance: 'bg-[#FDE68A] text-[#92400E] hover:bg-[#FCD34D]',
  deepCleaning: 'bg-[#BFDBFE] text-[#1E40AF] hover:bg-[#93C5FD]',
};

const LEGEND_DOTS: Record<DayStatus | 'specialPrice' | 'today', string> = {
  available: 'bg-white border border-[#E5E9EE]',
  booked: 'bg-[#BBF7D0]',
  blocked: 'bg-[#FECACA]',
  maintenance: 'bg-[#FDE68A]',
  deepCleaning: 'bg-[#BFDBFE]',
  specialPrice: 'bg-[#E9D5FF]',
  today: 'bg-[#6366F1]',
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseApiDate(value: string): Date | null {
  if (!value) return null;
  const onlyDate = value.split('T')[0];
  const [y, m, d] = onlyDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function buildRangeSet(ranges: DateRange[] | undefined): Set<string> {
  const set = new Set<string>();
  if (!ranges) return set;
  for (const r of ranges) {
    const start = parseApiDate(r.from);
    const end = parseApiDate(r.to);
    if (!start || !end) continue;
    const cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      set.add(toIsoDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return set;
}

function toApiDateTime(iso: string): string {
  return `${iso}T00:00:00.000Z`;
}

type Modal =
  | { kind: 'options'; iso: string; status: DayStatus; specialPrice?: number }
  | { kind: 'block'; iso: string }
  | { kind: 'special'; iso: string; currentPrice?: number }
  | { kind: 'unblock'; iso: string }
  | null;

export function YearCalendar({
  propertyId,
  currency,
  propertyTitle,
  basePrice,
}: {
  propertyId: string;
  currency: string;
  propertyTitle: string;
  basePrice?: number;
}) {
  const { t, locale } = useTranslation();
  const { getToken, userId } = useAuth();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayIso = toIsoDate(today);

  const [year, setYear] = useState<number>(today.getFullYear());
  const [unavailable, setUnavailable] = useState<UnavailableDates | null>(null);
  const [specialPrices, setSpecialPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (targetYear: number) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token || controller.signal.aborted) return;

      const [unavailableRes, specialRes] = await Promise.all([
        UserPropertiesAPI.getUnavailableDates(propertyId, token, controller.signal),
        UserPropertiesAPI.getSpecialPriceDays(propertyId, targetYear, token, controller.signal),
      ]);

      if (controller.signal.aborted) return;

      if (unavailableRes.success && unavailableRes.data) {
        const raw = unavailableRes.data as Record<string, unknown>;
        const data = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Partial<UnavailableDates>;
        setUnavailable({
          bookedDates: Array.isArray(data.bookedDates) ? data.bookedDates : [],
          blockedDates: Array.isArray(data.blockedDates) ? data.blockedDates : [],
          maintenanceDates: Array.isArray(data.maintenanceDates) ? data.maintenanceDates : [],
          deepCleaningDates: Array.isArray(data.deepCleaningDates) ? data.deepCleaningDates : [],
        });
      } else {
        setUnavailable({ bookedDates: [], blockedDates: [], maintenanceDates: [], deepCleaningDates: [] });
      }

      if (specialRes.success && specialRes.data) {
        const raw = specialRes.data as Record<string, unknown>;
        const list = (Array.isArray(raw.data) ? raw.data : Array.isArray(raw) ? raw : []) as SpecialPriceDay[];
        const map: Record<string, number> = {};
        for (const item of list) {
          if (!item?.date) continue;
          const iso = item.date.split('T')[0];
          if (iso && typeof item.price === 'number') map[iso] = item.price;
        }
        setSpecialPrices(map);
      } else {
        setSpecialPrices({});
      }
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : 'fetch-failed');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [propertyId, getToken]);

  useEffect(() => {
    fetchData(year);
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [year, fetchData]);

  const bookedSet = useMemo(() => buildRangeSet(unavailable?.bookedDates), [unavailable]);
  const blockedSet = useMemo(() => buildRangeSet(unavailable?.blockedDates), [unavailable]);
  const maintenanceSet = useMemo(() => buildRangeSet(unavailable?.maintenanceDates), [unavailable]);
  const deepCleaningSet = useMemo(() => buildRangeSet(unavailable?.deepCleaningDates), [unavailable]);

  const getStatus = useCallback((iso: string): DayStatus => {
    if (bookedSet.has(iso)) return 'booked';
    if (blockedSet.has(iso)) return 'blocked';
    if (maintenanceSet.has(iso)) return 'maintenance';
    if (deepCleaningSet.has(iso)) return 'deepCleaning';
    return 'available';
  }, [bookedSet, blockedSet, maintenanceSet, deepCleaningSet]);

  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((i) => t(`addListing.propertyDetails.weekdays.${i}`));

  const handleDayClick = (iso: string) => {
    const dateObj = parseApiDate(iso);
    if (!dateObj) return;
    if (dateObj.getTime() < today.getTime()) return;
    const status = getStatus(iso);
    if (status === 'booked' || status === 'maintenance' || status === 'deepCleaning') return;
    if (status === 'blocked') {
      setModal({ kind: 'unblock', iso });
      return;
    }
    setModal({ kind: 'options', iso, status, specialPrice: specialPrices[iso] });
  };

  const handleSuccess = async (successKey: 'successBlock' | 'successUnblock' | 'successPrice') => {
    setModal(null);
    await fetchData(year);
    Swal.fire({
      icon: 'success',
      title: t(`addListing.propertyDetails.${successKey}`),
      timer: 1500,
      showConfirmButton: false,
      confirmButtonColor: '#10B981',
    });
  };

  const formatModalDate = (iso: string): string => {
    const d = parseApiDate(iso);
    if (!d) return iso;
    try {
      return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white border border-[#E5E9EE] rounded-2xl p-5 lg:p-6">
      <div className="flex flex-col gap-1 mb-5">
        <h3 className="text-sm font-bold text-[#1D242B] uppercase tracking-wider">
          {t('addListing.propertyDetails.calendarTitle')}
        </h3>
        <p className="text-xs text-[#647C94]">{t('addListing.propertyDetails.calendarSubtitle')}</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          aria-label={t('addListing.propertyDetails.previousYear')}
          onClick={() => setYear((y) => y - 1)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-[#647C94] hover:bg-[#F8F9FA] transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{year - 1}</span>
        </button>
        <h4 className="text-xl font-bold text-[#1D242B]">{year}</h4>
        <button
          type="button"
          aria-label={t('addListing.propertyDetails.nextYear')}
          onClick={() => setYear((y) => y + 1)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-[#647C94] hover:bg-[#F8F9FA] transition-colors disabled:opacity-50"
        >
          <span>{year + 1}</span>
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>

      {error ? (
        <div className="py-12 text-center text-sm text-[#9CA3AF]">{error}</div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${loading ? 'opacity-60' : ''}`}>
          {Array.from({ length: 12 }, (_, monthIndex) => (
            <MonthGrid
              key={monthIndex}
              year={year}
              monthIndex={monthIndex}
              weekdays={weekdays}
              monthName={t(`addListing.propertyDetails.months.${monthIndex + 1}`)}
              today={today}
              todayIso={todayIso}
              specialPrices={specialPrices}
              getStatus={getStatus}
              currency={currency}
              basePrice={basePrice}
              perNightLabel={t('addListing.propertyDetails.perNight')}
              specialPriceLabel={t('addListing.propertyDetails.legendSpecialPrice')}
              pastTooltip={t('addListing.propertyDetails.pastDateTooltip')}
              statusLabels={{
                available: t('addListing.propertyDetails.legendAvailable'),
                booked: t('addListing.propertyDetails.legendBooked'),
                blocked: t('addListing.propertyDetails.legendBlocked'),
                maintenance: t('addListing.propertyDetails.legendMaintenance'),
                deepCleaning: t('addListing.propertyDetails.legendDeepCleaning'),
              }}
              todayLabel={t('addListing.propertyDetails.legendToday')}
              onDayClick={handleDayClick}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-8 pt-5 border-t border-[#F0F2F5]">
        <LegendItem dotClass={LEGEND_DOTS.available} label={t('addListing.propertyDetails.legendAvailable')} />
        <LegendItem dotClass={LEGEND_DOTS.booked} label={t('addListing.propertyDetails.legendBooked')} />
        <LegendItem dotClass={LEGEND_DOTS.blocked} label={t('addListing.propertyDetails.legendBlocked')} />
        <LegendItem dotClass={LEGEND_DOTS.maintenance} label={t('addListing.propertyDetails.legendMaintenance')} />
        <LegendItem dotClass={LEGEND_DOTS.specialPrice} label={t('addListing.propertyDetails.legendSpecialPrice')} />
        <LegendItem dotClass={LEGEND_DOTS.deepCleaning} label={t('addListing.propertyDetails.legendDeepCleaning')} />
        <LegendItem dotClass={LEGEND_DOTS.today} label={t('addListing.propertyDetails.legendToday')} />
      </div>

      {modal?.kind === 'options' && (
        <DayOptionsModal
          iso={modal.iso}
          formattedDate={formatModalDate(modal.iso)}
          propertyTitle={propertyTitle}
          currency={currency}
          currentRate={modal.specialPrice ?? basePrice}
          onClose={() => setModal(null)}
          onChoose={(choice) => {
            if (choice === 'block') setModal({ kind: 'block', iso: modal.iso });
            else setModal({ kind: 'special', iso: modal.iso, currentPrice: modal.specialPrice });
          }}
        />
      )}

      {modal?.kind === 'block' && (
        <BlockDatesModal
          iso={modal.iso}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          userId={userId ?? ''}
          getToken={getToken}
          onClose={() => setModal(null)}
          onSuccess={() => handleSuccess('successBlock')}
        />
      )}

      {modal?.kind === 'special' && (
        <SpecialPriceModal
          iso={modal.iso}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          currency={currency}
          currentPrice={modal.currentPrice ?? basePrice}
          adminId={userId ?? ''}
          getToken={getToken}
          onClose={() => setModal(null)}
          onSuccess={() => handleSuccess('successPrice')}
        />
      )}

      {modal?.kind === 'unblock' && (
        <UnblockModal
          iso={modal.iso}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          formattedDate={formatModalDate(modal.iso)}
          userId={userId ?? ''}
          getToken={getToken}
          onClose={() => setModal(null)}
          onSuccess={() => handleSuccess('successUnblock')}
        />
      )}
    </div>
  );
}

function LegendItem({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-4 h-4 rounded ${dotClass}`} />
      <span className="text-xs text-[#647C94]">{label}</span>
    </div>
  );
}

function MonthGrid({
  year,
  monthIndex,
  weekdays,
  monthName,
  today,
  todayIso,
  specialPrices,
  getStatus,
  currency,
  basePrice,
  perNightLabel,
  specialPriceLabel,
  pastTooltip,
  statusLabels,
  todayLabel,
  onDayClick,
}: {
  year: number;
  monthIndex: number;
  weekdays: string[];
  monthName: string;
  today: Date;
  todayIso: string;
  specialPrices: Record<string, number>;
  getStatus: (iso: string) => DayStatus;
  currency: string;
  basePrice?: number;
  perNightLabel: string;
  specialPriceLabel: string;
  pastTooltip: string;
  statusLabels: Record<DayStatus, string>;
  todayLabel: string;
  onDayClick: (iso: string) => void;
}) {
  const firstDay = new Date(year, monthIndex, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="border border-[#F0F2F5] rounded-xl p-3">
      <h5 className="text-sm font-semibold text-[#1D242B] text-center mb-2">{monthName}</h5>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekdays.map((w, i) => (
          <span key={i} className="text-[10px] text-[#B0B8C1] text-center font-medium">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <span key={i} className="aspect-square" />;
          const dateObj = new Date(year, monthIndex, day);
          const iso = toIsoDate(dateObj);
          const isToday = iso === todayIso;
          const isPast = dateObj.getTime() < today.getTime();
          const status = getStatus(iso);
          const specialPrice = specialPrices[iso];
          const hasSpecialPrice = typeof specialPrice === 'number' && status === 'available';
          let cellClass = STATUS_STYLES[status];
          if (hasSpecialPrice) {
            cellClass = 'bg-[#E9D5FF] text-[#5B21B6] hover:bg-[#DDD6FE]';
          }
          if (isToday) {
            cellClass = 'bg-[#6366F1] text-white font-bold hover:bg-[#4F46E5]';
          }
          const isActionable = !isPast && status !== 'booked' && status !== 'maintenance' && status !== 'deepCleaning';
          const displayPrice = hasSpecialPrice ? specialPrice : basePrice;
          const showPrice = typeof displayPrice === 'number';
          let tooltipLabel: string;
          if (isPast) tooltipLabel = pastTooltip;
          else if (isToday) tooltipLabel = todayLabel;
          else if (hasSpecialPrice) tooltipLabel = specialPriceLabel;
          else tooltipLabel = statusLabels[status];
          return (
            <button
              key={i}
              type="button"
              onClick={isActionable ? () => onDayClick(iso) : undefined}
              disabled={!isActionable}
              className={`group relative aspect-square text-[11px] rounded transition-colors flex items-center justify-center ${cellClass} ${isPast && !isToday ? 'opacity-60' : ''} ${isActionable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {day}
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <span className="relative flex flex-col items-center bg-[#1F2937] text-white rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
                  {showPrice ? (
                    <span className="text-[13px] font-semibold leading-tight" dir="ltr">{currency} {displayPrice}{perNightLabel}</span>
                  ) : null}
                  <span className="text-[10px] text-[#D1D5DB] leading-tight">{tooltipLabel}</span>
                  <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[#1F2937] rotate-45" />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModalShell({
  icon,
  iconBg,
  title,
  subtitle,
  onClose,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[560px] bg-white rounded-3xl shadow-xl p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              {icon}
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-lg font-bold text-[#1D242B]">{title}</h3>
              {subtitle ? <p className="text-xs text-[#647C94] truncate">{subtitle}</p> : null}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F8F9FA] flex items-center justify-center text-[#5E5E5E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DayOptionsModal({
  formattedDate,
  propertyTitle,
  currency,
  currentRate,
  onClose,
  onChoose,
}: {
  iso: string;
  formattedDate: string;
  propertyTitle: string;
  currency: string;
  currentRate?: number;
  onClose: () => void;
  onChoose: (choice: 'block' | 'special') => void;
}) {
  const { t } = useTranslation();
  const rateLabel = currentRate !== undefined ? `${currency} ${currentRate}${t('addListing.propertyDetails.perNight')}` : '—';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[560px] bg-white rounded-3xl shadow-xl p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3 className="text-xl font-bold text-[#1D242B]">{t('addListing.propertyDetails.actionTitle')}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F8F9FA] flex items-center justify-center text-[#5E5E5E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-[#647C94]">{formattedDate}</p>
        <p className="text-xs text-[#9CA3AF] mb-5 truncate">{propertyTitle}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => onChoose('block')}
            className="text-start p-5 border border-[#E5E9EE] rounded-2xl hover:border-[#FCC519] hover:bg-[#FFFBEB] transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFEDD5] flex items-center justify-center mb-3">
              <CalendarX className="w-5 h-5 text-[#EA580C]" />
            </div>
            <h4 className="text-base font-bold text-[#1D242B] mb-1">{t('addListing.propertyDetails.actionBlock')}</h4>
            <p className="text-xs text-[#647C94]">{t('addListing.propertyDetails.actionBlockDesc')}</p>
          </button>
          <button
            type="button"
            onClick={() => onChoose('special')}
            className="text-start p-5 border border-[#E5E9EE] rounded-2xl hover:border-[#6366F1] hover:bg-[#EEF2FF] transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E0E7FF] flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-[#6366F1]" />
            </div>
            <h4 className="text-base font-bold text-[#1D242B] mb-1">{t('addListing.propertyDetails.actionSpecial')}</h4>
            <p className="text-xs text-[#647C94]">{t('addListing.propertyDetails.actionSpecialDesc', { rate: rateLabel })}</p>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-semibold text-[#1D242B] bg-[#F8F9FA] hover:bg-[#F0F2F5] transition-colors"
        >
          {t('addListing.propertyDetails.cancel')}
        </button>
      </div>
    </div>
  );
}

function BlockDatesModal({
  iso,
  propertyId,
  propertyTitle,
  userId,
  getToken,
  onClose,
  onSuccess,
}: {
  iso: string;
  propertyId: string;
  propertyTitle: string;
  userId: string;
  getToken: () => Promise<string | null>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [fromDate, setFromDate] = useState(iso);
  const [toDate, setToDate] = useState(iso);
  const [reasonId, setReasonId] = useState<number | ''>('');
  const [reasonText, setReasonText] = useState('');
  const [reasons, setReasons] = useState<BlockReason[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await UserPropertiesAPI.getBlockReasons(token);
        if (cancelled) return;
        if (res.success && res.data) {
          const raw = res.data as unknown;
          const list = (Array.isArray(raw) ? raw : (typeof raw === 'object' && raw !== null && Array.isArray((raw as { data?: unknown }).data) ? (raw as { data: unknown[] }).data : [])) as BlockReason[];
          setReasons(list);
          if (list.length > 0 && typeof list[0].id === 'number') setReasonId(list[0].id);
        }
      } finally {
        if (!cancelled) setLoadingReasons(false);
      }
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  const handleSubmit = async () => {
    if (new Date(toDate).getTime() < new Date(fromDate).getTime()) {
      Swal.fire({ icon: 'error', title: t('addListing.propertyDetails.invalidRange'), confirmButtonColor: '#000' });
      return;
    }
    if (typeof reasonId !== 'number') {
      Swal.fire({ icon: 'error', title: t('addListing.propertyDetails.selectReasonError'), confirmButtonColor: '#000' });
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await UserPropertiesAPI.updateCalendarStatus(
        {
          propertyId,
          userId,
          fromDate,
          toDate,
          status: 'Blocked',
          reasonId,
          reasonText: reasonText.trim(),
        },
        token
      );
      if (res.success) {
        onSuccess();
      } else {
        const errData = res.data as { message?: string } | undefined;
        Swal.fire({
          icon: 'error',
          title: t('addListing.propertyDetails.errorTitle'),
          text: errData?.message || res.error,
          confirmButtonColor: '#000',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      icon={<CalendarX className="w-5 h-5 text-[#EA580C]" />}
      iconBg="bg-[#FFEDD5]"
      title={t('addListing.propertyDetails.actionBlock')}
      subtitle={propertyTitle}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.propertyDetails.fromDate')}</label>
            <input
              type="date"
              value={fromDate}
              min={iso}
              disabled={submitting}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-xl text-sm text-[#1D242B] outline-none focus:border-[#FCC519] focus:bg-white transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.propertyDetails.toDate')}</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              disabled={submitting}
              onChange={(e) => setToDate(e.target.value)}
              className="px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-xl text-sm text-[#1D242B] outline-none focus:border-[#FCC519] focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.propertyDetails.reason')}</label>
          <select
            value={reasonId}
            disabled={submitting || loadingReasons}
            onChange={(e) => setReasonId(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-xl text-sm text-[#1D242B] outline-none focus:border-[#FCC519] focus:bg-white transition-colors disabled:opacity-50"
          >
            <option value="">{t('addListing.propertyDetails.reasonPlaceholder')}</option>
            {reasons.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1D242B]">
            {t('addListing.propertyDetails.notes')}
            <span className="text-[#9CA3AF] font-normal ms-1">{t('addListing.propertyDetails.notesOptional')}</span>
          </label>
          <textarea
            value={reasonText}
            disabled={submitting}
            onChange={(e) => setReasonText(e.target.value)}
            rows={3}
            placeholder={t('addListing.propertyDetails.notesPlaceholder')}
            className="px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519] focus:bg-white transition-colors resize-none"
          />
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#1D242B] bg-[#F0F2F5] hover:bg-[#E5E9EE] transition-colors disabled:opacity-50"
          >
            {t('addListing.propertyDetails.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#DC2626] transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? t('addListing.propertyDetails.blocking') : t('addListing.propertyDetails.actionBlock')}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function SpecialPriceModal({
  iso,
  propertyId,
  propertyTitle,
  currency,
  currentPrice,
  adminId,
  getToken,
  onClose,
  onSuccess,
}: {
  iso: string;
  propertyId: string;
  propertyTitle: string;
  currency: string;
  currentPrice?: number;
  adminId: string;
  getToken: () => Promise<string | null>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [fromDate, setFromDate] = useState(iso);
  const [toDate, setToDate] = useState(iso);
  const [price, setPrice] = useState<string>(currentPrice !== undefined ? String(currentPrice) : '');
  const [submitting, setSubmitting] = useState(false);

  const currentRateLabel = currentPrice !== undefined ? `${currency} ${currentPrice}` : '—';

  const handleSubmit = async () => {
    if (new Date(toDate).getTime() < new Date(fromDate).getTime()) {
      Swal.fire({ icon: 'error', title: t('addListing.propertyDetails.invalidRange'), confirmButtonColor: '#000' });
      return;
    }
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      Swal.fire({ icon: 'error', title: t('addListing.propertyDetails.invalidPrice'), confirmButtonColor: '#000' });
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await UserPropertiesAPI.setSpecialPrice(
        {
          adminId,
          propertyId,
          fromDate: toApiDateTime(fromDate),
          toDate: toApiDateTime(toDate),
          price: numericPrice,
        },
        token
      );
      if (res.success) {
        onSuccess();
      } else {
        const errData = res.data as { message?: string } | undefined;
        Swal.fire({
          icon: 'error',
          title: t('addListing.propertyDetails.errorTitle'),
          text: errData?.message || res.error,
          confirmButtonColor: '#000',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      icon={<DollarSign className="w-5 h-5 text-[#6366F1]" />}
      iconBg="bg-[#E0E7FF]"
      title={t('addListing.propertyDetails.actionSpecial')}
      subtitle={propertyTitle}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.propertyDetails.fromDate')}</label>
            <input
              type="date"
              value={fromDate}
              min={iso}
              disabled={submitting}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-xl text-sm text-[#1D242B] outline-none focus:border-[#6366F1] focus:bg-white transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.propertyDetails.toDate')}</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              disabled={submitting}
              onChange={(e) => setToDate(e.target.value)}
              className="px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-xl text-sm text-[#1D242B] outline-none focus:border-[#6366F1] focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.propertyDetails.nightlyPrice')}</label>
          <div className="flex items-stretch">
            <span className="px-3 py-3 bg-[#F0F2F5] border-2 border-e-0 border-[#E5E9EE] rounded-s-xl text-sm font-medium text-[#5E5E5E] flex items-center">
              {currency}
            </span>
            <input
              type="number"
              dir="ltr"
              value={price}
              min={0}
              step="any"
              disabled={submitting}
              onKeyDown={blockNonPositiveNumeralKey}
              onChange={(e) => setPrice(stripArabicNumerals(e.target.value))}
              placeholder="0"
              className="flex-1 px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-e-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#6366F1] focus:bg-white transition-colors"
            />
          </div>
          <p className="text-xs text-[#9CA3AF]">{t('addListing.propertyDetails.currentRate', { rate: currentRateLabel })}</p>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#1D242B] bg-[#F0F2F5] hover:bg-[#E5E9EE] transition-colors disabled:opacity-50"
          >
            {t('addListing.propertyDetails.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#6366F1] hover:bg-[#4F46E5] transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? t('addListing.propertyDetails.saving') : t('addListing.propertyDetails.savePrice')}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function UnblockModal({
  iso,
  propertyId,
  propertyTitle,
  formattedDate,
  userId,
  getToken,
  onClose,
  onSuccess,
}: {
  iso: string;
  propertyId: string;
  propertyTitle: string;
  formattedDate: string;
  userId: string;
  getToken: () => Promise<string | null>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [reasonId, setReasonId] = useState<number | ''>('');
  const [reasonText, setReasonText] = useState('');
  const [reasons, setReasons] = useState<BlockReason[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await UserPropertiesAPI.getBlockReasons(token);
        if (cancelled) return;
        if (res.success && res.data) {
          const raw = res.data as unknown;
          const list = (Array.isArray(raw) ? raw : (typeof raw === 'object' && raw !== null && Array.isArray((raw as { data?: unknown }).data) ? (raw as { data: unknown[] }).data : [])) as BlockReason[];
          setReasons(list);
          if (list.length > 0 && typeof list[0].id === 'number') setReasonId(list[0].id);
        }
      } finally {
        if (!cancelled) setLoadingReasons(false);
      }
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  const handleSubmit = async () => {
    if (typeof reasonId !== 'number') {
      Swal.fire({ icon: 'error', title: t('addListing.propertyDetails.selectReasonError'), confirmButtonColor: '#000' });
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await UserPropertiesAPI.updateCalendarStatus(
        {
          propertyId,
          userId,
          fromDate: iso,
          toDate: iso,
          status: 'NONE',
          reasonId,
          reasonText: reasonText.trim(),
        },
        token
      );
      if (res.success) {
        onSuccess();
      } else {
        const errData = res.data as { message?: string } | undefined;
        Swal.fire({
          icon: 'error',
          title: t('addListing.propertyDetails.errorTitle'),
          text: errData?.message || res.error,
          confirmButtonColor: '#000',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      icon={<CalendarX className="w-5 h-5 text-[#10B981]" />}
      iconBg="bg-[#D1FAE5]"
      title={t('addListing.propertyDetails.unblockTitle')}
      subtitle={propertyTitle}
      onClose={onClose}
    >
      <p className="text-sm text-[#1D242B] mb-1">{formattedDate}</p>
      <p className="text-sm text-[#647C94] mb-5">{t('addListing.propertyDetails.unblockDesc')}</p>

      <div className="flex flex-col gap-4 mb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1D242B]">{t('addListing.propertyDetails.reason')}</label>
          <select
            value={reasonId}
            disabled={submitting || loadingReasons}
            onChange={(e) => setReasonId(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-xl text-sm text-[#1D242B] outline-none focus:border-[#10B981] focus:bg-white transition-colors disabled:opacity-50"
          >
            <option value="">{t('addListing.propertyDetails.reasonPlaceholder')}</option>
            {reasons.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1D242B]">
            {t('addListing.propertyDetails.notes')}
            <span className="text-[#9CA3AF] font-normal ms-1">{t('addListing.propertyDetails.notesOptional')}</span>
          </label>
          <textarea
            value={reasonText}
            disabled={submitting}
            onChange={(e) => setReasonText(e.target.value)}
            rows={3}
            placeholder={t('addListing.propertyDetails.notesPlaceholder')}
            className="px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#10B981] focus:bg-white transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#1D242B] bg-[#F0F2F5] hover:bg-[#E5E9EE] transition-colors disabled:opacity-50"
        >
          {t('addListing.propertyDetails.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#10B981] hover:bg-[#059669] transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {submitting ? t('addListing.propertyDetails.unblocking') : t('addListing.propertyDetails.unblock')}
        </button>
      </div>
    </ModalShell>
  );
}
