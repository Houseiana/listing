import { useState, useEffect } from "react";
import { LookupsAPI } from "@/lib/api/backend-api";
import { PropertyFormData } from "../types";

interface DescriptionStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
}

interface Highlight {
  id: number;
  name: string;
}

export const DescriptionStep = ({
  listing,
  setListing,
}: DescriptionStepProps) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true);
        const response = await LookupsAPI.getPropertyHighlights();
        if (response.success && response.data) {
          setHighlights(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch highlights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  const toggleHighlight = (id: number) => {
    setListing({
      ...listing,
      highlights: listing.highlights.includes(id)
        ? listing.highlights.filter((h) => h !== id)
        : [...listing.highlights, id],
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <textarea
          value={listing.description}
          onChange={(e) =>
            setListing({
              ...listing,
              description: e.target.value.slice(0, 500),
            })
          }
          placeholder="You'll always remember your time at this unique place."
          rows={6}
          maxLength={500}
          className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg resize-none"
        />
        <p className="text-sm text-gray-500 mt-2">
          {listing.description.length}/500
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Highlight what makes your place special
        </h3>
        <p className="text-gray-500 mb-4">Choose up to 2 highlights</p>

        {loading ? (
          <div className="text-gray-500">Loading highlights...</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {highlights.map((h) => {
              const idStr = String(h.id);
              return (
                <button
                  key={h.id}
                  onClick={() => toggleHighlight(h.id)}
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                    listing.highlights.includes(h.id)
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 text-gray-700 hover:border-gray-900"
                  }`}
                >
                  {h.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
