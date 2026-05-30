'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { Building2, Menu, Plus, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { LocaleSwitcher } from '@/app/components/LocaleSwitcher';
import { PropertyCountBadge } from '@/app/components/PropertyCountBadge';

const navLinkClass =
  'inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1D242B] rounded-full hover:bg-gray-50 hover:text-[#fcc519] transition-colors';

const mobileLinkClass =
  'flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#1D242B] rounded-xl hover:bg-gray-50 hover:text-[#fcc519] transition-colors';

export function Header() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FDFDFD] border-b border-[#F0F2F5]">
      <div className="px-3 sm:px-6 lg:px-[7.5%]">
        <div className="relative flex items-center justify-between h-16 lg:h-20">
          {/* Left: burger (mobile) + logo */}
          <div className="flex items-center gap-2" ref={menuRef}>
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={t('header.menu')}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-[#F0F2F5] text-[#1D242B] hover:bg-gray-50 transition-colors"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute top-full mt-2 left-0 z-50 w-60 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#F0F2F5] bg-white shadow-lg p-2"
                >
                  <Link href="/properties" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>
                    <Building2 className="w-4 h-4 text-[#fcc519]" />
                    {t('header.allProperties')}
                  </Link>
                  <Link href="/add-listing" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>
                    <Plus className="w-4 h-4 text-[#fcc519]" />
                    {t('home.startListing')}
                  </Link>
                  <div className="my-1 border-t border-[#F0F2F5]" />
                  <div className="px-2 py-1.5">
                    <p className="px-2 mb-1.5 text-[11px] font-medium text-gray-500">
                      {t('propertyCount.tooltip')}
                    </p>
                    <PropertyCountBadge align="start" />
                  </div>
                </div>
              )}
            </div>

            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/full_logo.png"
                alt={t('header.logoAlt')}
                width={152}
                height={72}
                className="w-28 sm:w-32 lg:w-[152px] h-auto"
              />
            </Link>
          </div>

          {/* Center: desktop nav */}
          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1">
            <Link href="/properties" className={navLinkClass}>
              <Building2 className="w-4 h-4 text-[#fcc519]" />
              {t('header.allProperties')}
            </Link>
            <Link href="/add-listing" className={navLinkClass}>
              <Plus className="w-4 h-4 text-[#fcc519]" />
              {t('home.startListing')}
            </Link>
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block">
              <PropertyCountBadge />
            </div>
            <LocaleSwitcher />
            <UserButton
              showName={false}
              appearance={{
                elements: {
                  avatarBox: 'w-9 h-9',
                  userButtonPopoverActionButton__manageAccount: 'hidden',
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
