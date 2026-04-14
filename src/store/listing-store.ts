import { create } from "zustand";
import type { ListingFormData } from "@/types/listing";

const initialFormData: ListingFormData = {
  propertyType: "",
  country: "",
  city: "",
  state: "",
  street: "",
  postalCode: "",
  buildingNumber: "",
  floorNumber: "",
  unitNumber: "",
  guests: 1,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  areaSize: 0,
  title: "",
  description: "",
  amenities: [],
  images: [],
};

interface ListingStore {
  currentStep: number;
  formData: ListingFormData;
  updateFormData: (data: Partial<ListingFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetForm: () => void;
}

export const useListingStore = create<ListingStore>((set) => ({
  currentStep: 0,
  formData: initialFormData,

  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 4),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  goToStep: (step) =>
    set({ currentStep: Math.max(0, Math.min(step, 4)) }),

  resetForm: () =>
    set({ currentStep: 0, formData: initialFormData }),
}));
