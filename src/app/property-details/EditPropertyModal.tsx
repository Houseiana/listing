'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Pencil, Plus, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Swal from 'sweetalert2';
import { UserPropertiesAPI } from '@/lib/api/backend-api';
import { useTranslation } from '@/lib/i18n/context';
import { blockNonPositiveNumeralKey, stripArabicNumerals } from '@/lib/utils/numeric-input';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type EditPropertyInitial = {
  title?: string;
  description?: string;
  pricePerNight?: number;
  cleaningFee?: number;
  electricalFee?: number;
  waterFee?: number;
  coverPhoto?: string;
  photos?: string[];
  currency?: string;
};

export function EditPropertyModal({
  propertyId,
  initial,
  onClose,
  onSaved,
}: {
  propertyId: string;
  initial: EditPropertyInitial;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { getToken, userId } = useAuth();

  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [pricePerNight, setPricePerNight] = useState<string>(numToStr(initial.pricePerNight));
  const [cleaningFee, setCleaningFee] = useState<string>(numToStr(initial.cleaningFee));
  const [electricalFee, setElectricalFee] = useState<string>(numToStr(initial.electricalFee));
  const [waterFee, setWaterFee] = useState<string>(numToStr(initial.waterFee));

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | undefined>(initial.coverPhoto);

  const [existingPhotos] = useState<string[]>(initial.photos ?? []);
  const [photosToRemove, setPhotosToRemove] = useState<Set<string>>(new Set());
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, submitting]);

  useEffect(() => {
    return () => {
      newPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPhotoPreviews]);

  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [coverFile]);

  const currency = initial.currency || 'EGP';

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      Swal.fire({ icon: 'error', title: t('addListing.propertyDetails.edit.fileTooLarge'), confirmButtonColor: '#000' });
      e.target.value = '';
      return;
    }
    setCoverFile(file);
    e.target.value = '';
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const valid: File[] = [];
    let tooLarge = false;
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) {
        tooLarge = true;
        continue;
      }
      valid.push(f);
    }
    if (tooLarge) {
      Swal.fire({ icon: 'error', title: t('addListing.propertyDetails.edit.fileTooLarge'), confirmButtonColor: '#000' });
    }
    if (valid.length > 0) {
      setNewPhotos((prev) => [...prev, ...valid]);
      setNewPhotoPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
    }
    e.target.value = '';
  };

  const toggleRemoveExisting = (url: string) => {
    setPhotosToRemove((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      Swal.fire({ icon: 'error', title: t('addListing.propertyDetails.edit.titleRequired'), confirmButtonColor: '#000' });
      return false;
    }
    const prices = [pricePerNight, cleaningFee, electricalFee, waterFee];
    for (const p of prices) {
      if (p === '') continue;
      const n = Number(p);
      if (!Number.isFinite(n) || n < 0) {
        Swal.fire({ icon: 'error', title: t('addListing.propertyDetails.edit.invalidPrice'), confirmButtonColor: '#000' });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token || !userId) return;
      const formData = new FormData();
      formData.append('adminId', userId);
      formData.append('propertyId', propertyId);
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (pricePerNight !== '') formData.append('pricePerNight', String(Number(pricePerNight)));
      if (cleaningFee !== '') formData.append('cleaningFee', String(Number(cleaningFee)));
      if (electricalFee !== '') formData.append('electricalFee', String(Number(electricalFee)));
      if (waterFee !== '') formData.append('waterFee', String(Number(waterFee)));
      if (coverFile) formData.append('coverPhoto', coverFile);
      for (const url of photosToRemove) formData.append('photoUrlsToRemove', url);
      for (const f of newPhotos) formData.append('newPhotos', f);

      const res = await UserPropertiesAPI.editProperty(formData, token);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: t('addListing.propertyDetails.edit.success'),
          timer: 1500,
          showConfirmButton: false,
          confirmButtonColor: '#10B981',
        });
        onSaved();
      } else {
        const errData = res.data as { message?: string } | undefined;
        Swal.fire({
          icon: 'error',
          title: t('addListing.propertyDetails.edit.errorTitle'),
          text: errData?.message || res.error,
          confirmButtonColor: '#000',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const photosCount = useMemo(
    () => existingPhotos.length - photosToRemove.size + newPhotos.length,
    [existingPhotos.length, photosToRemove.size, newPhotos.length]
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-2 sm:px-4 py-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-[1090px] max-h-full bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 lg:px-8 py-5 border-b border-[#F0F2F5]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FCC519]/15 flex items-center justify-center flex-shrink-0">
              <Pencil className="w-5 h-5 text-[#B38600]" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-[#1D242B]">{t('addListing.propertyDetails.edit.title')}</h2>
              <p className="text-xs text-[#647C94] truncate max-w-[60vw]">{initial.title || ''}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={submitting}
            className="w-9 h-9 rounded-full hover:bg-[#F8F9FA] flex items-center justify-center text-[#5E5E5E] disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 flex flex-col gap-7">
          <Section title={t('addListing.propertyDetails.edit.basicInfo')} hint={t('addListing.propertyDetails.edit.basicInfoHint')}>
            <div className="flex flex-col gap-3">
              <Field label={t('addListing.propertyDetails.edit.titleLabel')} required>
                <input
                  type="text"
                  value={title}
                  disabled={submitting}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('addListing.propertyDetails.edit.titlePlaceholder')}
                  className={inputClass}
                />
              </Field>
              <Field label={t('addListing.propertyDetails.edit.descriptionLabel')}>
                <textarea
                  value={description}
                  disabled={submitting}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder={t('addListing.propertyDetails.edit.descriptionPlaceholder')}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </Section>

          <Section title={t('addListing.propertyDetails.edit.pricing')} hint={t('addListing.propertyDetails.edit.pricingHint')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CurrencyField
                label={t('addListing.propertyDetails.edit.pricePerNight')}
                value={pricePerNight}
                onChange={setPricePerNight}
                currency={currency}
                disabled={submitting}
              />
              <CurrencyField
                label={t('addListing.propertyDetails.edit.cleaningFee')}
                value={cleaningFee}
                onChange={setCleaningFee}
                currency={currency}
                disabled={submitting}
              />
              <CurrencyField
                label={t('addListing.propertyDetails.edit.electricalFee')}
                value={electricalFee}
                onChange={setElectricalFee}
                currency={currency}
                disabled={submitting}
              />
              <CurrencyField
                label={t('addListing.propertyDetails.edit.waterFee')}
                value={waterFee}
                onChange={setWaterFee}
                currency={currency}
                disabled={submitting}
              />
            </div>
          </Section>

          <Section title={t('addListing.propertyDetails.edit.coverPhoto')} hint={t('addListing.propertyDetails.edit.coverPhotoHint')}>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleCoverChange}
            />
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-[#F8F9FA] border border-[#E5E9EE] group">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                  <ImageIcon className="w-10 h-10" />
                  <p className="text-xs">{t('addListing.propertyDetails.edit.uploadCover')}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={submitting}
                className="absolute bottom-3 end-3 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-[#1D242B] shadow flex items-center gap-1.5 hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                {coverPreview ? t('addListing.propertyDetails.edit.replaceCover') : t('addListing.propertyDetails.edit.uploadCover')}
              </button>
              {coverFile ? (
                <span className="absolute top-3 start-3 px-2.5 py-1 bg-[#FCC519] text-[#1D242B] rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {t('addListing.propertyDetails.edit.newBadge')}
                </span>
              ) : null}
            </div>
          </Section>

          <Section
            title={t('addListing.propertyDetails.edit.photos')}
            hint={t('addListing.propertyDetails.edit.photosHint')}
            count={photosCount}
          >
            <input
              ref={photosInputRef}
              type="file"
              accept="image/*"
              hidden
              multiple
              onChange={handlePhotosChange}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {existingPhotos.map((url) => {
                const marked = photosToRemove.has(url);
                return (
                  <div
                    key={url}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      marked ? 'border-red-400 opacity-60' : 'border-[#E5E9EE]'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    {marked ? (
                      <div className="absolute inset-0 bg-red-500/15 flex flex-col items-center justify-center gap-1">
                        <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-semibold uppercase tracking-wider">
                          {t('addListing.propertyDetails.edit.markedForRemoval')}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleRemoveExisting(url)}
                          disabled={submitting}
                          className="px-3 py-1 bg-white rounded-full text-[11px] font-semibold text-[#1D242B] hover:bg-[#F8F9FA] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {t('addListing.propertyDetails.edit.undoRemove')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleRemoveExisting(url)}
                        disabled={submitting}
                        title="Remove"
                        className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {newPhotoPreviews.map((url, idx) => (
                <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#FCC519]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute top-2 start-2 px-2 py-0.5 bg-[#FCC519] text-[#1D242B] rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {t('addListing.propertyDetails.edit.newBadge')}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(idx)}
                    disabled={submitting}
                    title="Remove"
                    className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => photosInputRef.current?.click()}
                disabled={submitting}
                className="aspect-square rounded-xl border-2 border-dashed border-[#E5E9EE] flex flex-col items-center justify-center gap-1.5 text-[#5E5E5E] hover:border-[#FCC519] hover:bg-[#FCC519]/5 hover:text-[#1D242B] transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-full bg-[#FCC519]/10 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-[#B38600]" />
                </div>
                <span className="text-[11px] font-semibold">{t('addListing.propertyDetails.edit.addPhotos')}</span>
                <span className="text-[9px] text-[#9CA3AF] px-2 text-center leading-tight">{t('addListing.propertyDetails.edit.dropHint')}</span>
              </button>
            </div>
          </Section>
        </div>

        <div className="flex items-center gap-3 px-6 lg:px-8 py-4 border-t border-[#F0F2F5] bg-[#FBFCFD]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 sm:flex-initial sm:min-w-[140px] py-3 px-5 rounded-full text-sm font-semibold text-[#1D242B] bg-white border border-[#E5E9EE] hover:bg-[#F8F9FA] transition-colors disabled:opacity-50"
          >
            {t('addListing.propertyDetails.edit.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 px-5 rounded-full text-sm font-bold text-[#1D242B] bg-[#FCC519] hover:bg-[#f0bb0e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('addListing.propertyDetails.edit.saving')}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {t('addListing.propertyDetails.edit.save')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519] focus:bg-white transition-colors disabled:opacity-50';

function numToStr(n: number | undefined): string {
  if (n === undefined || n === null) return '';
  return String(n);
}

function Section({
  title,
  hint,
  count,
  children,
}: {
  title: string;
  hint?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-[#1D242B] uppercase tracking-wider">{title}</h3>
          {hint ? <p className="text-xs text-[#9CA3AF] mt-0.5">{hint}</p> : null}
        </div>
        {typeof count === 'number' ? (
          <span className="text-xs font-semibold text-[#647C94] bg-[#F8F9FA] rounded-full px-2.5 py-0.5">{count}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[#1D242B]">
        {label}
        {required ? <span className="text-red-500 ms-1">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function CurrencyField({
  label,
  value,
  onChange,
  currency,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  currency: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <div className="flex items-stretch">
        <span className="px-3 py-3 bg-[#F0F2F5] border-2 border-e-0 border-[#E5E9EE] rounded-s-xl text-sm font-medium text-[#5E5E5E] flex items-center min-w-[60px] justify-center">
          {currency}
        </span>
        <input
          type="number"
          dir="ltr"
          value={value}
          min={0}
          step="any"
          disabled={disabled}
          onKeyDown={blockNonPositiveNumeralKey}
          onChange={(e) => onChange(stripArabicNumerals(e.target.value))}
          placeholder="0"
          className="flex-1 px-4 py-3 bg-[#F8F9FA] border-2 border-[#E5E9EE] rounded-e-xl text-sm text-[#1D242B] placeholder:text-[#B0B8C1] outline-none focus:border-[#FCC519] focus:bg-white transition-colors disabled:opacity-50"
        />
      </div>
    </Field>
  );
}
