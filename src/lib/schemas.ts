import { z } from "zod";

export const categorySchema = z.object({
  propertyType: z.string().min(1, "Please select a property type"),
});

export const locationSchema = z.object({
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  state: z.string(),
  street: z.string().min(1, "Street address is required"),
  postalCode: z.string(),
  buildingNumber: z.string(),
  floorNumber: z.string(),
  unitNumber: z.string(),
});

export const detailsSchema = z.object({
  guests: z.number().min(1, "At least 1 guest required"),
  bedrooms: z.number().min(1, "At least 1 bedroom required"),
  beds: z.number().min(1, "At least 1 bed required"),
  bathrooms: z.number().min(1, "At least 1 bathroom required"),
  areaSize: z.number().min(1, "Area size is required"),
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title must be under 100 characters"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(1000, "Description must be under 1000 characters"),
  amenities: z.array(z.string()).min(1, "Select at least one amenity"),
});

export const imagesSchema = z.object({
  images: z
    .array(z.instanceof(File))
    .min(3, "Upload at least 3 photos")
    .max(20, "Maximum 20 photos"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
export type LocationFormValues = z.infer<typeof locationSchema>;
export type DetailsFormValues = z.infer<typeof detailsSchema>;
export type ImagesFormValues = z.infer<typeof imagesSchema>;
