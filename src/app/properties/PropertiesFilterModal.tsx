'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { UserPropertiesAPI } from '@/lib/api/backend-api';
import { useTranslation } from '@/lib/i18n/context';

export type PropertiesFilter = {
  countryId?: string;
  stateId?: string;
  cityId?: string;
  villageId?: string;
  minPrice?: number;
  maxPrice?: number;
  // Human-readable labels captured at apply time so the summary can show
  // names instead of raw IDs. The API layer only reads the *Id fields.
  countryName?: string;
  stateName?: string;
  cityName?: string;
  villageName?: string;
};

type LookupOption = { id: string; name: string };

interface PropertiesFilterModalProps {
  open: boolean;
  initial: PropertiesFilter;
  onClose: () => void;
  onApply: (filters: PropertiesFilter) => void;
}

const emptyFilter: PropertiesFilter = {};

function toNumber(value: string) {
  const normalized = value.trim();
  if (normalized === '') return undefined;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function parseLookupList(raw: unknown): LookupOption[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown })?.data)
    ? ((raw as { data: unknown[] }).data)
    : [];

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const idRaw = obj.id ?? obj.countryId ?? obj.stateId ?? obj.cityId ?? obj.villageId ?? obj.itemId ?? obj.value;
      const nameRaw = obj.name ?? obj.title ?? obj.label ?? obj.text;
      const id = idRaw == null ? '' : String(idRaw);
      const name = typeof nameRaw === 'string' ? nameRaw : String(nameRaw ?? '');
      if (!id || !name) return null;
      return { id, name };
    })
    .filter((item): item is LookupOption => item !== null);
}

export function PropertiesFilterModal({ open, initial, onClose, onApply }: PropertiesFilterModalProps) {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [draftFilter, setDraftFilter] = useState<PropertiesFilter>(initial);
  const [countries, setCountries] = useState<LookupOption[]>([]);
  const [states, setStates] = useState<LookupOption[]>([]);
  const [cities, setCities] = useState<LookupOption[]>([]);
  const [villages, setVillages] = useState<LookupOption[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraftFilter(initial);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    let canceled = false;

    const loadCountries = async () => {
      setFetchError(null);
      setIsLoadingCountries(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await UserPropertiesAPI.getCountriesLookup(token);
        if (!canceled && res.success) {
          setCountries(parseLookupList(res.data));
        }
      } catch (error) {
        if (!canceled) setFetchError(t('properties.filter.loadCountriesError'));
      } finally {
        if (!canceled) setIsLoadingCountries(false);
      }
    };

    loadCountries();

    return () => {
      canceled = true;
    };
  }, [open, getToken]);

  useEffect(() => {
    if (!open) return;
    if (!draftFilter.countryId) {
      setStates([]);
      return;
    }

    let canceled = false;

    const loadStates = async () => {
      setFetchError(null);
      setIsLoadingStates(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await UserPropertiesAPI.getStatesLookup(draftFilter.countryId!, token);
        if (!canceled && res.success) {
          setStates(parseLookupList(res.data));
        }
      } catch (error) {
        if (!canceled) setFetchError(t('properties.filter.loadStatesError'));
      } finally {
        if (!canceled) setIsLoadingStates(false);
      }
    };

    setStates([]);
    setCities([]);
    setVillages([]);
    loadStates();

    return () => {
      canceled = true;
    };
  }, [open, draftFilter.countryId, getToken]);

  useEffect(() => {
    if (!open) return;
    if (!draftFilter.stateId) {
      setCities([]);
      return;
    }

    let canceled = false;

    const loadCities = async () => {
      setFetchError(null);
      setIsLoadingCities(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await UserPropertiesAPI.getCitiesLookup(draftFilter.stateId!, token);
        if (!canceled && res.success) {
          setCities(parseLookupList(res.data));
        }
      } catch (error) {
        if (!canceled) setFetchError(t('properties.filter.loadCitiesError'));
      } finally {
        if (!canceled) setIsLoadingCities(false);
      }
    };

    setCities([]);
    setVillages([]);
    loadCities();

    return () => {
      canceled = true;
    };
  }, [open, draftFilter.stateId, getToken]);

  useEffect(() => {
    if (!open) return;
    if (!draftFilter.cityId) {
      setVillages([]);
      return;
    }

    let canceled = false;

    const loadVillages = async () => {
      setFetchError(null);
      setIsLoadingVillages(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await UserPropertiesAPI.getVillagesLookup(draftFilter.cityId!, token);
        if (!canceled && res.success) {
          setVillages(parseLookupList(res.data));
        }
      } catch (error) {
        if (!canceled) setFetchError(t('properties.filter.loadVillagesError'));
      } finally {
        if (!canceled) setIsLoadingVillages(false);
      }
    };

    setVillages([]);
    loadVillages();

    return () => {
      canceled = true;
    };
  }, [open, draftFilter.cityId, getToken]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const invalidPrice =
    draftFilter.minPrice !== undefined &&
    draftFilter.maxPrice !== undefined &&
    draftFilter.minPrice > draftFilter.maxPrice;

  const hasValues =
    Boolean(draftFilter.countryId) ||
    Boolean(draftFilter.stateId) ||
    Boolean(draftFilter.cityId) ||
    Boolean(draftFilter.villageId) ||
    draftFilter.minPrice !== undefined ||
    draftFilter.maxPrice !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(33,40,54,0.18)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#E5E9EE] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[#1D242B]">{t('properties.filter.title')}</h2>
            <p className="text-sm text-[#647C94]">{t('properties.filter.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E9EE] text-[#647C94] transition hover:bg-[#F8F9FA]"
            aria-label={t('properties.filter.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          {fetchError ? (
            <div className="rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {fetchError}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#65768E]">
                {t('properties.filter.country')}
              </span>
              <select
                value={draftFilter.countryId ?? ''}
                onChange={(event) => {
                  setDraftFilter((prev) => ({
                    ...prev,
                    countryId: event.target.value || undefined,
                    stateId: undefined,
                    cityId: undefined,
                    villageId: undefined,
                  }));
                }}
                className="w-full rounded-3xl border border-[#E5E9EE] bg-white px-4 py-3 text-sm text-[#1D242B] outline-none transition focus:border-[#FCC519]"
              >
                <option value="">{t('properties.filter.allCountries')}</option>
                {countries.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#65768E]">
                {t('properties.filter.state')}
              </span>
              <select
                value={draftFilter.stateId ?? ''}
                onChange={(event) => {
                  setDraftFilter((prev) => ({
                    ...prev,
                    stateId: event.target.value || undefined,
                    cityId: undefined,
                    villageId: undefined,
                  }));
                }}
                disabled={!draftFilter.countryId || isLoadingStates}
                className="w-full rounded-3xl border border-[#E5E9EE] bg-white px-4 py-3 text-sm text-[#1D242B] outline-none transition focus:border-[#FCC519] disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
              >
                <option value="">{t('properties.filter.allStates')}</option>
                {states.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#65768E]">
                {t('properties.filter.city')}
              </span>
              <select
                value={draftFilter.cityId ?? ''}
                onChange={(event) => {
                  setDraftFilter((prev) => ({
                    ...prev,
                    cityId: event.target.value || undefined,
                    villageId: undefined,
                  }));
                }}
                disabled={!draftFilter.stateId || isLoadingCities}
                className="w-full rounded-3xl border border-[#E5E9EE] bg-white px-4 py-3 text-sm text-[#1D242B] outline-none transition focus:border-[#FCC519] disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
              >
                <option value="">{t('properties.filter.allCities')}</option>
                {cities.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#65768E]">
                {t('properties.filter.village')}
              </span>
              <select
                value={draftFilter.villageId ?? ''}
                onChange={(event) => {
                  setDraftFilter((prev) => ({
                    ...prev,
                    villageId: event.target.value || undefined,
                  }));
                }}
                disabled={!draftFilter.cityId || isLoadingVillages}
                className="w-full rounded-3xl border border-[#E5E9EE] bg-white px-4 py-3 text-sm text-[#1D242B] outline-none transition focus:border-[#FCC519] disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
              >
                <option value="">{t('properties.filter.allVillages')}</option>
                {villages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#65768E]">
                {t('properties.filter.minPrice')}
              </span>
              <input
                type="number"
                min={0}
                value={draftFilter.minPrice ?? ''}
                placeholder="0"
                onChange={(event) => {
                  setDraftFilter((prev) => ({
                    ...prev,
                    minPrice: toNumber(event.target.value),
                  }));
                }}
                className="w-full rounded-3xl border border-[#E5E9EE] bg-white px-4 py-3 text-sm text-[#1D242B] outline-none transition focus:border-[#FCC519]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#65768E]">
                {t('properties.filter.maxPrice')}
              </span>
              <input
                type="number"
                min={0}
                value={draftFilter.maxPrice ?? ''}
                placeholder={t('properties.filter.noMax')}
                onChange={(event) => {
                  setDraftFilter((prev) => ({
                    ...prev,
                    maxPrice: toNumber(event.target.value),
                  }));
                }}
                className="w-full rounded-3xl border border-[#E5E9EE] bg-white px-4 py-3 text-sm text-[#1D242B] outline-none transition focus:border-[#FCC519]"
              />
            </label>
          </div>

          {invalidPrice ? (
            <p className="text-sm text-[#B91C1C]">{t('properties.filter.invalidPrice')}</p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[#647C94]">
              {hasValues ? t('properties.filter.ready') : t('properties.filter.none')}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setDraftFilter(emptyFilter)}
                disabled={!hasValues}
                className="rounded-full border border-[#E5E9EE] bg-white px-4 py-3 text-sm font-semibold text-[#1D242B] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('properties.filter.clear')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (invalidPrice) return;
                  const nameById = (list: LookupOption[], id?: string) =>
                    id ? list.find((item) => item.id === id)?.name : undefined;
                  onApply({
                    ...draftFilter,
                    countryName: nameById(countries, draftFilter.countryId),
                    stateName: nameById(states, draftFilter.stateId),
                    cityName: nameById(cities, draftFilter.cityId),
                    villageName: nameById(villages, draftFilter.villageId),
                  });
                }}
                className="rounded-full bg-[#FCC519] px-5 py-3 text-sm font-semibold text-[#1D242B] transition hover:bg-[#F0BB0E]"
              >
                {t('properties.filter.apply')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
