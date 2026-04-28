import React, { useState, useEffect } from 'react';
import { Counter } from './Counter';
import { PropertyFormData } from '../types';
import { Users, DoorOpen, BedDouble, Bath, Expand } from 'lucide-react';
import { stripArabicNumerals, blockArabicNumeralKey } from '@/lib/utils/numeric-input';

interface BasicsStepProps {
  listing: PropertyFormData;
  updateCounter: (field: keyof PropertyFormData, delta: number) => void;
  onBatchUpdate?: (updates: Partial<PropertyFormData>) => void;
  readOnly?: boolean;
}

// Clamp helper
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function BasicsStep({
  listing,
  updateCounter,
  onBatchUpdate,
  readOnly,
}: BasicsStepProps) {
  const guests = listing.guests || 1;
  const bedrooms = listing.bedrooms || 1;
  const beds = listing.beds || 1;
  const bathrooms = listing.bathrooms || 1;
  const areaSize = listing.area_size || 25;
  const [areaInput, setAreaInput] = useState(String(areaSize));

  useEffect(() => {
    setAreaInput(String(areaSize));
  }, [areaSize]);

  // --- Limits (each field independent of the others) ---
  const minGuests = 1;
  const maxGuests = 20;

  const minBedrooms = 0;
  const maxBedrooms = 20;

  const minBeds = 1;
  const maxBeds = 20;

  const minBathrooms = 1;
  const maxBathrooms = 10;

  const minAreaSize = 25;
  const maxAreaSize = 3000;

  // --- Change handler: each field clamps only against its own bounds ---
  const handleChange = (field: string, delta: number) => {
    if (readOnly) return;

    if (!onBatchUpdate) {
      updateCounter(field as keyof PropertyFormData, delta);
      return;
    }

    if (field === 'guests') {
      onBatchUpdate({ guests: clamp(guests + delta, minGuests, maxGuests) });
    } else if (field === 'bedrooms') {
      onBatchUpdate({ bedrooms: clamp(bedrooms + delta, minBedrooms, maxBedrooms) });
    } else if (field === 'beds') {
      onBatchUpdate({ beds: clamp(beds + delta, minBeds, maxBeds) });
    } else if (field === 'bathrooms') {
      onBatchUpdate({ bathrooms: clamp(bathrooms + delta, minBathrooms, maxBathrooms) });
    } else if (field === 'area_size') {
      onBatchUpdate({ area_size: clamp(areaSize + delta, minAreaSize, maxAreaSize) });
    }
  };

  return (
    <div className="border border-[#F0F2F5] rounded-2xl py-4">
      <Counter
        label="Guests"
        sublabel="Maximum number of guests"
        value={guests}
        field="guests"
        min={minGuests}
        max={maxGuests}
        disabled={readOnly}
        onChange={handleChange}
        icon={<Users className="w-[18px] h-[18px] text-[#5E5E5E]" />}
      />
      <div className="mx-6 h-px bg-[#F0F2F5]" />
      <Counter
        label="Bedrooms"
        sublabel="Number of bedrooms"
        value={bedrooms}
        field="bedrooms"
        min={minBedrooms}
        max={maxBedrooms}
        disabled={readOnly}
        onChange={handleChange}
        icon={<DoorOpen className="w-[18px] h-[18px] text-[#5E5E5E]" />}
      />
      <div className="mx-6 h-px bg-[#F0F2F5]" />
      <Counter
        label="Beds"
        sublabel="Number of beds"
        value={beds}
        field="beds"
        min={minBeds}
        max={maxBeds}
        disabled={readOnly}
        onChange={handleChange}
        icon={<BedDouble className="w-[18px] h-[18px] text-[#5E5E5E]" />}
      />
      <div className="mx-6 h-px bg-[#F0F2F5]" />
      <Counter
        label="Bathrooms"
        sublabel="Number of bathrooms"
        value={bathrooms}
        field="bathrooms"
        min={minBathrooms}
        max={maxBathrooms}
        disabled={readOnly}
        onChange={handleChange}
        icon={<Bath className="w-[18px] h-[18px] text-[#5E5E5E]" />}
      />
      <div className="mx-6 h-px bg-[#F0F2F5]" />
      <div className="flex items-center justify-between px-6 h-[90px]">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-[#F0F2F5] rounded-[14px] flex items-center justify-center flex-shrink-0">
            <Expand className="w-[18px] h-[18px] text-[#5E5E5E]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold text-[#2F3A45]">{"Total Area"}</span>
            <p className="text-xs text-[#9CA3AF]">{"Size of the property in square meters"}</p>
            <span className="text-xs text-pink-500 mt-1">{`${minAreaSize} - ${maxAreaSize} m²`}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            title="Total area in square meters"
            value={areaInput}
            min={minAreaSize}
            max={maxAreaSize}
            disabled={readOnly}
            onChange={(e) => {
              const raw = stripArabicNumerals(e.target.value);
              if (raw === '') { setAreaInput(''); return; }
              const num = parseInt(raw, 10);
              if (isNaN(num) || num < 0) return;
              if (num > maxAreaSize) { setAreaInput(String(maxAreaSize)); return; }
              setAreaInput(String(num));
            }}
            onKeyDown={(e) => {
              blockArabicNumeralKey(e);
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            onBlur={() => {
              const val = parseInt(areaInput, 10);
              const clamped = (!areaInput || isNaN(val) || val < minAreaSize) ? minAreaSize : Math.min(val, maxAreaSize);
              setAreaInput(String(clamped));
              onBatchUpdate?.({ area_size: clamped });
            }}
            className="w-20 h-[42px] rounded-xl border border-[#F0F2F5] bg-[#F8F9FA] text-center text-base text-[#1D242B] outline-none focus:border-[#FCC519] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-[#9CA3AF]">m²</span>
        </div>
      </div>
    </div>
  );
}
