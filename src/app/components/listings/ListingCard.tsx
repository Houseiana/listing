import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Edit3,
  Star,
  Eye,
  MapPin,
  Bed,
  Bath,
  Image as ImageIcon,
  Users,
  Trash2,
  MoreHorizontal,
  CalendarDays,
  Loader2,
  Power,
  Ban,
  DoorOpen,
} from 'lucide-react';
import { statusConfig } from './constants';
import Swal from 'sweetalert2';

export interface Listing {
  id: string;
  title: string;
  status: string;
  coverPhoto?: string;
  currency?: string;
  basePrice: number;
  reviewCount: number;
  rating?: number;
  views: number;
  location?: string;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  occupancy: number;
  earnings: { total: number; thisMonth: number };
  pauseReason?: string;
  deactivationReason?: string;
  createdAt?: string;
  lastUpdated?: string;
}

const STATUS_LABELS: Record<string, string> = {
  statusActive: 'Active',
  statusPending: 'Pending',
  statusPaused: 'Paused',
  statusDraft: 'Draft',
  statusInactive: 'Inactive',
  statusActionRequired: 'Action Required',
};

export interface ListingCardProps {
  listing: Listing;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onViewCalendar: () => void;
  onDelete: () => void | Promise<void>;
  onToggleStatus: () => void | Promise<void>;
  onBlock: () => void;
}

export function ListingCard({
  listing,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onViewCalendar,
  onDelete,
  onToggleStatus,
  onBlock,
}: ListingCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLoading = loadingAction !== null;

  const handleAction = async (
    action: string,
    fn: () => void | Promise<void>
  ) => {
    setLoadingAction(action);
    try {
      await fn();
    } finally {
      setLoadingAction(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const status = statusConfig[listing.status];
  const isActive = listing.status === 'active';
  const isDraft = listing.status === 'draft' || listing.status === 'pending' || listing.status === 'actionrequired';

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className={`bg-white rounded-3xl border overflow-hidden hover:shadow-lg transition-all group ${
        isSelected
          ? 'border-[#FCC519] ring-2 ring-[#FCC519]'
          : 'border-[#E8EAED]'
      }`}
    >
      {/* Image */}
      <div className="relative h-[200px] bg-[#F0F2F5]">
        {listing?.coverPhoto ? (
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={handleImageClick}
          >
            <Image
              src={listing?.coverPhoto}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={75}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={handleImageClick}
          >
            <ImageIcon className="w-20 h-20 text-[#C0C6D0]" />
          </div>
        )}

        {/* Status Badge */}
        <div
          className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${status.color}`}
        >
          {React.createElement(status.icon, { className: 'w-3 h-3' })}
          {STATUS_LABELS[status.labelKey] || status.labelKey}
        </div>

        {/* Price Badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1">
          <span className="text-[12px] font-bold text-[#1D242B]">
            {listing.currency || 'EGP'} {listing.basePrice}
          </span>
          <span className="text-[10px] text-[#9CA3AF]">/night</span>
        </div>

        {/* Bottom overlay pills */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          {listing.reviewCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
              <Star className="w-3 h-3 text-[#FFB900] fill-[#FFB900]" />
              <span className="text-[11px] font-medium text-white">
                {listing.reviewCount} reviews
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <Eye className="w-3 h-3 text-white" strokeWidth={1.5} />
            <span className="text-[11px] font-medium text-white">
              {listing.views.toLocaleString()} views
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-[15px] font-bold text-[#1D242B] line-clamp-1">
            {listing.title || 'Untitled Property'}
          </h3>
          {isDraft ? (
            <button
              type="button"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('delete', onDelete);
              }}
              disabled={isLoading}
              className="w-8 h-8 rounded-full border border-[#E8EAED] flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0"
            >
              {loadingAction === 'delete' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              )}
            </button>
          ) : (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                type="button"
                title="More options"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="w-8 h-8 rounded-full border border-[#E8EAED] flex items-center justify-center hover:bg-[#F8F9FA] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-[#6B7280]" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 z-30 w-44 bg-white rounded-xl border border-[#E8EAED] shadow-lg py-1.5 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      handleAction('toggle', onToggleStatus);
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-[#1D242B] hover:bg-[#F8F9FA] transition-colors"
                  >
                    {loadingAction === 'toggle' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Power className="w-3.5 h-3.5" />
                    )}
                    {isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onBlock();
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-[#1D242B] hover:bg-[#F8F9FA] transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Block Dates
                  </button>
                  <div className="border-t border-[#F0F2F5] my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      handleAction('delete', onDelete);
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {loadingAction === 'delete' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="w-3 h-3 text-[#9CA3AF] flex-shrink-0" strokeWidth={1.5} />
          <p className="text-xs text-[#9CA3AF] truncate">
            {listing.location || 'Unknown location'}
          </p>
        </div>

        {/* Amenity Pills */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex items-center gap-1.5 bg-[#F8F9FA] rounded-full px-2.5 py-1.5">
            <DoorOpen className="w-3 h-3 text-[#5E5E5E]" strokeWidth={1.5} />
            <span className="text-[11px] font-medium text-[#5E5E5E]">
              {listing.bedrooms} {listing.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F8F9FA] rounded-full px-2.5 py-1.5">
            <Bed className="w-3 h-3 text-[#5E5E5E]" strokeWidth={1.5} />
            <span className="text-[11px] font-medium text-[#5E5E5E]">
              {listing.beds} {listing.beds === 1 ? 'bed' : 'beds'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F8F9FA] rounded-full px-2.5 py-1.5">
            <Bath className="w-3 h-3 text-[#5E5E5E]" strokeWidth={1.5} />
            <span className="text-[11px] font-medium text-[#5E5E5E]">
              {listing.bathrooms} {listing.bathrooms === 1 ? 'bath' : 'baths'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F8F9FA] rounded-full px-2.5 py-1.5">
            <Users className="w-3 h-3 text-[#5E5E5E]" strokeWidth={1.5} />
            <span className="text-[11px] font-medium text-[#5E5E5E]">
              {listing.maxGuests} {listing.maxGuests === 1 ? 'guest' : 'guests'}
            </span>
          </div>
        </div>

        {/* 3-Column Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[rgba(252,197,25,0.08)] border border-[rgba(252,197,25,0.2)] rounded-xl py-2.5 px-2 flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-[#B38600]">{listing.occupancy}%</span>
            <span className="text-[10px] text-[#9CA3AF]">Occupancy</span>
          </div>
          <div className="bg-[#F8F9FA] rounded-xl py-2.5 px-2 flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-[#1D242B]">
              {listing.earnings.total > 0 ? `${listing.earnings.total}` : '0'}
            </span>
            <span className="text-[10px] text-[#9CA3AF]">This Month</span>
          </div>
          <div className="bg-[#F8F9FA] rounded-xl py-2.5 px-2 flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-[#1D242B]">{listing.views.toLocaleString()}</span>
            <span className="text-[10px] text-[#9CA3AF]">Total Views</span>
          </div>
        </div>

        {(listing.pauseReason || listing.deactivationReason) && (
          <div className="mb-4 p-2.5 bg-[#FFFBEB] rounded-xl flex items-start gap-2">
            <Power className="w-3.5 h-3.5 text-[#FFB900] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#6B7280]">
              {listing.pauseReason || listing.deactivationReason}
            </p>
          </div>
        )}

        {!isDraft && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 h-[38px] bg-[#1D242B] text-white rounded-full text-xs font-medium hover:bg-[#2F3A45] transition-colors ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onViewCalendar(); }}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 h-[38px] border border-[#E8EAED] rounded-full text-xs font-medium text-[#1D242B] hover:bg-[#F8F9FA] transition-colors ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.75} />
              Calendar
            </button>
            <button
              type="button"
              title="View Listing"
              onClick={(e) => { e.stopPropagation(); onView(); }}
              disabled={isLoading}
              className={`w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center border border-[#E8EAED] rounded-full hover:bg-[#F8F9FA] transition-colors ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <Eye className="w-3.5 h-3.5 text-[#6B7280]" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
