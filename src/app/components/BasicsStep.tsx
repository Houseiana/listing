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

  // --- Limits (derived from current state) ---
  const minGuests = 1;
  const maxGuests = 20;

  const minBedrooms = 0;
  const maxBedrooms = guests; // can't have more bedrooms than guests

  const minBeds = Math.max(bedrooms, Math.ceil(guests / 2)); // at least 1 per bedroom, at least 1 per 2 guests
  const maxBeds = Math.max(guests, minBeds); // at least 1 per guest, but never below minBeds

  const minBathrooms = 1;
  const maxBathrooms = Math.min(5, bedrooms + 1);

  const minAreaSize = 25;
  const maxAreaSize = 3000;

  // --- Smart change handler: cascades adjustments in one update ---
  const handleChange = (field: string, delta: number) => {
    if (readOnly) return;

    // If no batch update available, fall back to simple updateCounter
    if (!onBatchUpdate) {
      updateCounter(field as keyof PropertyFormData, delta);
      return;
    }

    let newGuests = guests;
    let newBedrooms = bedrooms;
    let newBeds = beds;
    let newBathrooms = bathrooms;

    // Apply the user's change
    if (field === 'guests') newGuests = clamp(guests + delta, minGuests, maxGuests);
    if (field === 'bedrooms') newBedrooms = clamp(bedrooms + delta, minBedrooms, maxBedrooms);
    if (field === 'beds') newBeds = clamp(beds + delta, minBeds, maxBeds);
    if (field === 'bathrooms') newBathrooms = clamp(bathrooms + delta, minBathrooms, maxBathrooms);
    if (field === 'area_size') {
      onBatchUpdate({ area_size: clamp(areaSize + delta, minAreaSize, maxAreaSize) });
      return;
    }

    // Cascade: if guests changed, clamp dependents
    if (field === 'guests') {
      // Bedrooms can't exceed guests
      const newMaxBedrooms = newGuests;
      newBedrooms = clamp(newBedrooms, minBedrooms, newMaxBedrooms);

      // Beds: min is max(bedrooms, ceil(guests/2)), max is guests
      const newMinBeds = Math.max(newBedrooms, Math.ceil(newGuests / 2));
      const newMaxBeds = Math.max(newGuests, newMinBeds);
      newBeds = clamp(newBeds, newMinBeds, newMaxBeds);

      // Bathrooms: capped at bedrooms + 1
      const newMaxBathrooms = Math.min(5, newBedrooms + 1);
      newBathrooms = clamp(newBathrooms, minBathrooms, newMaxBathrooms);
    }

    // Cascade: if bedrooms changed, clamp beds and bathrooms
    if (field === 'bedrooms') {
      // Beds must be at least bedrooms
      const newMinBeds = Math.max(newBedrooms, Math.ceil(newGuests / 2));
      const newMaxBeds = Math.max(newGuests, newMinBeds);
      newBeds = clamp(newBeds, newMinBeds, newMaxBeds);

      // Bathrooms: capped at bedrooms + 1
      const newMaxBathrooms = Math.min(5, newBedrooms + 1);
      newBathrooms = clamp(newBathrooms, minBathrooms, newMaxBathrooms);
    }

    // Apply all changes in one update
    onBatchUpdate({
      guests: newGuests,
      bedrooms: newBedrooms,
      beds: newBeds,
      bathrooms: newBathrooms,
    });
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
