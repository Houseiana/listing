import React from 'react';
import {
  Edit3,
  Star,
  Eye,
  CalendarDays,
  Image as ImageIcon,
  MapPin,
  Bed,
  Bath,
  Clock,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Listing } from './ListingCard';
import { statusConfig } from './constants';
import Swal from 'sweetalert2';

const STATUS_LABELS: Record<string, string> = {
  statusActive: 'Active',
  statusPending: 'Pending',
  statusPaused: 'Paused',
  statusDraft: 'Draft',
  statusInactive: 'Inactive',
  statusActionRequired: 'Action Required',
};

function formatListedDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `Listed ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export interface ListingRowProps {
  listing: Listing;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onViewCalendar: () => void;
  onDelete: () => void;
}

export function ListingRow({
  listing,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onViewCalendar,
  onDelete,
}: ListingRowProps) {
  const status = statusConfig[listing.status];
  const isDraft = listing.status === 'draft' || listing.status === 'pending' || listing.status === 'actionrequired';

  const handleRowClick = () => {
    if (listing.status === 'draft' || listing.status === 'actionrequired') {
      Swal.fire({
        title: 'Complete Your Listing',
        text: 'This listing is incomplete. Would you like to continue creating it?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#FCC519',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Continue Creating',
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) {
          onEdit();
        }
      });
    } else if (listing.status === 'pending') {
      Swal.fire({
        title: 'Pending Approval',
        text: 'This listing is currently under review.',
        icon: 'info',
        confirmButtonColor: '#FCC519',
        confirmButtonText: 'OK',
      });
    } else {
      onView();
    }
  };

  return (
    <div
      onClick={handleRowClick}
      className={`bg-white rounded-[20px] border-[0.8px] overflow-hidden flex h-[198px] hover:shadow-md transition-all cursor-pointer ${
        isSelected ? 'border-[#FCC519] ring-2 ring-[#FCC519]' : 'border-[#E8EAED]'
      }`}
    >
      {/* Left: Image Thumbnail */}
      <div className="relative w-[280px] h-full flex-shrink-0 bg-[#F0F2F5]">
        {listing?.coverPhoto ? (
          <img
            src={listing.coverPhoto}
            alt={listing.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.jpg';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-[#C0C6D0]" />
          </div>
        )}

        {/* Status Badge */}
        <div
          className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${status.color}`}
        >
          {React.createElement(status.icon, { className: 'w-3 h-3' })}
          {STATUS_LABELS[status.labelKey] || status.labelKey}
        </div>

        {listing.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <Star className="w-3 h-3 text-[#FCC519] fill-[#FCC519]" />
            <span className="text-[11px] text-white">
              {listing.rating} · {listing.reviewCount}
            </span>
          </div>
        )}
      </div>

      {/* Right: Content */}
      <div className="flex-1 min-w-0 flex flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-[#1D242B] truncate">
                {listing.title || 'Untitled Property'}
              </h3>
              <span className="flex-shrink-0 bg-[#1D242B] text-white text-xs font-bold px-3 py-1 rounded-full">
                {listing.currency || 'EGP'} {listing.basePrice}/night
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#9CA3AF] flex-shrink-0" strokeWidth={1.5} />
              <p className="text-xs text-[#9CA3AF] truncate">
                {listing.location || 'Unknown location'}
              </p>
            </div>
          </div>

          {!isDraft && (
            <button
              type="button"
              title="More options"
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full border-[0.8px] border-[#E8EAED] flex items-center justify-center hover:bg-[#F8F9FA] transition-colors flex-shrink-0"
            >
              <MoreHorizontal className="w-4 h-4 text-[#6B7280]" />
            </button>
          )}
        </div>

        {/* Amenities + Stats */}
        <div className="flex items-center gap-4 mt-auto">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#F8F9FA] rounded-full px-2.5 py-1.5">
              <Bed className="w-3 h-3 text-[#5E5E5E]" strokeWidth={1.5} />
              <span className="text-[11px] font-medium text-[#5E5E5E]">
                {listing.bedrooms || 0} {listing.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#F8F9FA] rounded-full px-2.5 py-1.5">
              <Bath className="w-3 h-3 text-[#5E5E5E]" strokeWidth={1.5} />
              <span className="text-[11px] font-medium text-[#5E5E5E]">
                {listing.bathrooms || 0} {listing.bathrooms === 1 ? 'bath' : 'baths'}
              </span>
            </div>
          </div>

          <div className="w-px h-5 bg-[#E8EAED]" />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-[#B38600]">{listing.occupancy}%</span>
              <span className="text-[11px] text-[#9CA3AF]">Occupancy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-[#1D242B]">
                {listing.earnings.thisMonth > 0 ? `${listing.earnings.thisMonth.toLocaleString()}` : '0'}
              </span>
              <span className="text-[11px] text-[#9CA3AF]">This Month</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-[#1D242B]">{listing.views.toLocaleString()}</span>
              <span className="text-[11px] text-[#9CA3AF]">Views</span>
            </div>
          </div>
        </div>

        {/* Actions + Timestamp */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F0F2F5]">
          <div className="flex items-center gap-2">
            {!isDraft && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="flex items-center gap-1.5 h-9 px-5 bg-[#1D242B] text-white rounded-full text-xs font-semibold hover:bg-[#2F3A45] transition-colors"
                >
                  <Edit3 className="w-3 h-3" strokeWidth={1.75} />
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onViewCalendar(); }}
                  className="flex items-center gap-1.5 h-9 px-5 border-[0.8px] border-[#E8EAED] rounded-full text-xs font-semibold text-[#1D242B] hover:bg-[#F8F9FA] transition-colors"
                >
                  <CalendarDays className="w-3 h-3" strokeWidth={1.75} />
                  Calendar
                </button>
                <button
                  type="button"
                  title="Preview"
                  onClick={(e) => { e.stopPropagation(); onView(); }}
                  className="w-9 h-9 flex items-center justify-center border-[0.8px] border-[#E8EAED] rounded-full hover:bg-[#F8F9FA] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#6B7280]" strokeWidth={1.75} />
                </button>
              </>
            )}
            <button
              type="button"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-9 h-9 flex items-center justify-center border-[0.8px] border-[#E8EAED] rounded-full hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" strokeWidth={1.75} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#B0B5BD]" strokeWidth={1.5} />
            <span className="text-[11px] text-[#B0B5BD]">
              {formatListedDate(listing.createdAt || listing.lastUpdated || '')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
