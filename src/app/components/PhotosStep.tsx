import { PropertyFormData } from '../types';
import { Camera, Trash2, ImagePlus, Image as ImageIcon } from 'lucide-react';
import { RequiredFieldLabel, ValidationError } from '@/components/ui/ValidationError';

interface PhotosStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  readOnly?: boolean;
  validationErrors?: Record<string, string>;
  hasAttemptedNext?: boolean;
}

export const PhotosStep = ({
  listing,
  setListing,
  readOnly,
  validationErrors = {},
  hasAttemptedNext = false,
}: PhotosStepProps) => {
  const handlePhotoUpload = (files: FileList | null) => {
    if (files && !readOnly) {
      const newPhotos = Array.from(files);
      setListing({
        ...listing,
        photos: [...listing.photos, ...newPhotos].slice(0, 20),
      });
    }
  };

  const handleCoverPhotoUpload = (files: FileList | null) => {
    if (files && files[0] && !readOnly) {
      setListing({ ...listing, coverPhoto: files[0] });
    }
  };

  const hasError = hasAttemptedNext && validationErrors.photos;
  const hasCoverError = hasAttemptedNext && validationErrors.coverPhoto;
  const photosCount = listing.photos.length;

  const coverPhotoSrc = listing.coverPhoto
    ? listing.coverPhoto instanceof File
      ? URL.createObjectURL(listing.coverPhoto)
      : listing.coverPhoto
    : null;

  return (
    <div className="space-y-8">
      {/* Cover Photo Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-[#2F3A45]">
          {'Cover Photo'}
        </h3>
        <p className="text-sm text-[#5E5E5E]">{'This will be the main photo guests see first'}</p>

        <input
          type="file"
          accept="image/*"
          title="Cover Photo"
          onChange={(e) => handleCoverPhotoUpload(e.target.files)}
          className="hidden"
          id="cover-photo-upload"
        />

        {coverPhotoSrc ? (
          <div className="relative w-full h-[240px] rounded-2xl overflow-hidden border-2 border-[#FCC519]">
            <img
              src={coverPhotoSrc}
              alt="Cover Photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-[#FCC519] rounded-full text-xs font-semibold text-[#1D242B]">
              {'Cover Photo'}
            </div>
            {!readOnly && (
              <div className="absolute top-3 right-3 flex gap-2">
                <label
                  htmlFor="cover-photo-upload"
                  className="w-[42px] h-[42px] bg-white/90 backdrop-blur-sm border border-[#E5E9EE] rounded-xl flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                >
                  <ImagePlus className="w-5 h-5 text-[#1D242B]" />
                </label>
                <button
                  type="button"
                  title="Remove cover photo"
                  onClick={() => setListing({ ...listing, coverPhoto: null })}
                  className="w-[42px] h-[42px] bg-white/90 backdrop-blur-sm border border-[#E5E9EE] rounded-xl flex items-center justify-center hover:bg-white transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-[#D00416]" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <label
            htmlFor={readOnly ? undefined : 'cover-photo-upload'}
            className={`border-2 border-dashed rounded-2xl h-[180px] flex items-center justify-center transition-all ${
              readOnly
                ? 'border-[#E5E9EE] cursor-not-allowed opacity-70'
                : hasCoverError
                  ? 'border-red-300 bg-red-50 cursor-pointer'
                  : 'border-[#E5E9EE] bg-white cursor-pointer hover:border-[#FCC519]'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#F0F2F5] flex items-center justify-center">
                <Camera className="w-7 h-7 text-[#9CA3AF]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-semibold text-[#5E5E5E]">
                {'Upload cover photo'}
              </span>
              <span className="text-xs text-[#9CA3AF]">
                {'JPG, PNG up to 10MB'}
              </span>
            </div>
          </label>
        )}
      </div>

      <div className="h-px bg-[#E5E9EE]" />

      {/* Hidden file input shared across both states */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handlePhotoUpload(e.target.files)}
        className="hidden"
        id="photo-upload"
      />

      {listing.photos.length === 0 ? (
        /* ── EMPTY STATE ── */
        <>
          {/* Upload area */}
          <label
            htmlFor={readOnly ? undefined : 'photo-upload'}
            className={`border-2 rounded-2xl h-[400px] flex items-center justify-center transition-all ${
              readOnly
                ? 'border-[#E5E9EE] cursor-not-allowed opacity-70'
                : hasError
                  ? 'border-red-300 bg-red-50 cursor-pointer'
                  : 'border-[#E5E9EE] bg-white cursor-pointer hover:border-[#FCC519]'
            }`}
          >
            <div className="flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[#F0F2F5] flex items-center justify-center">
                <Camera className="w-10 h-10 text-[#9CA3AF]" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-[#1D242B]">
                {'Drag and drop your photos here'}
              </h3>
              <p className={`text-base text-center ${hasError ? 'text-red-500' : 'text-[#5E5E5E]'}`}>
                {'Upload at least 5 photos'}
              </p>
              <span className="bg-[#FCC519] w-[200px] h-[52px] rounded-xl flex items-center justify-center text-base font-medium text-[#1D242B] hover:bg-[#f0bb0e] transition-colors">
                {'Browse'}
              </span>
            </div>
          </label>

          {/* 4 empty placeholder slots */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[190px] border-2 border-dashed border-[#E5E9EE] rounded-2xl flex items-center justify-center bg-white"
              >
                <ImageIcon className="w-6 h-6 text-[#D1D5DB]" strokeWidth={1.5} />
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ── WITH PHOTOS STATE ── */
        <>
          {/* Main cover photo */}
          <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border-2 border-[#E5E9EE]">
            <img
              src={
                listing.photos[0] instanceof File
                  ? URL.createObjectURL(listing.photos[0])
                  : (listing.photos[0] as string)
              }
              alt="Main photo"
              className="w-full h-full object-cover"
            />
            {!readOnly && (
              <button
                type="button"
                title="Delete main photo"
                onClick={() =>
                  setListing({
                    ...listing,
                    photos: listing.photos.filter((_, i) => i !== 0),
                  })
                }
                className="absolute top-4 right-4 w-[52px] h-[52px] bg-[#F0F2F5] border border-[#F0F2F5] rounded-2xl flex items-center justify-center hover:bg-[#E5E9EE] transition-colors"
              >
                <Trash2 className="w-6 h-6 text-[#D00416]" />
              </button>
            )}
          </div>

          {/* Thumbnail grid: Add Photo + remaining photos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Add Photo button */}
            {!readOnly && (
              <label
                htmlFor="photo-upload"
                className="h-[190px] border-2 border-dashed border-[#FDDC75] rounded-[20px] flex flex-col items-center justify-center gap-2 bg-white cursor-pointer hover:border-[#FCC519] transition-colors"
              >
                <div className="w-[52px] h-[52px] rounded-full bg-[#F8F9FA] flex items-center justify-center">
                  <ImagePlus className="w-[22px] h-[22px] text-[#9CA3AF]" strokeWidth={1.5} />
                </div>
                <span className="text-[13px] font-semibold text-[#5E5E5E]">
                  {'Add Photo'}
                </span>
              </label>
            )}

            {/* Remaining photo thumbnails */}
            {listing.photos.slice(1).map((photo, index) => (
              <div
                key={index + 1}
                className="relative h-[190px] rounded-2xl overflow-hidden"
              >
                <img
                  src={
                    photo instanceof File
                      ? URL.createObjectURL(photo)
                      : (photo as string)
                  }
                  alt={`Photo ${index + 2}`}
                  className="w-full h-full object-cover"
                />
                {!readOnly && (
                  <button
                    type="button"
                    title={`Delete photo ${index + 2}`}
                    onClick={() =>
                      setListing({
                        ...listing,
                        photos: listing.photos.filter(
                          (_, i) => i !== index + 1
                        ),
                      })
                    }
                    className="absolute top-3 right-3 w-[52px] h-[52px] bg-[#F0F2F5] border border-[#F0F2F5] rounded-2xl flex items-center justify-center hover:bg-[#E5E9EE] transition-colors"
                  >
                    <Trash2 className="w-6 h-6 text-[#D00416]" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Quick Tips card */}
          <div className="bg-[rgba(240,242,245,0.5)] rounded-[20px] px-5 py-5 flex gap-4 items-start">
            <div className="w-9 h-9 rounded-[14px] bg-white flex items-center justify-center flex-shrink-0">
              <Camera className="w-[18px] h-[18px] text-[#1D242B]" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-[15px] font-semibold text-[#2F3A45]">
                {'Quick Tips'}
              </h4>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li className="text-[13px] text-[#5E5E5E]">
                  {'Use natural light for the best results'}
                </li>
                <li className="text-[13px] text-[#5E5E5E]">
                  {'Shoot from the corners of the room for a wider view'}
                </li>
                <li className="text-[13px] text-[#5E5E5E]">
                  {'Make your first photo the most inviting one'}
                </li>
              </ul>
            </div>
          </div>
        </>
      )}

      {hasError && (
        <ValidationError
          message="Photos are required"
          description={`You have uploaded ${photosCount} photo(s). Please upload at least 5.`}
        />
      )}
    </div>
  );
};
